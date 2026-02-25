// Enterprise Medical UI - JavaScript with Stage 2 Integration
class MedicalDiagnosticSystem {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.AI_SERVICE_URL = 'http://localhost:5001';
        this.currentPatient = null;
        this.currentImage = null;
        this.analysisInProgress = false;
        this.stage1Passed = false;
        this.stage1Result = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTimestamp();
        this.checkSystemStatus();
        
        setInterval(() => this.updateTimestamp(), 1000);
        setInterval(() => this.checkSystemStatus(), 30000);
    }

    setupEventListeners() {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
        });

        const patientForm = document.getElementById('patient-form');
        if (patientForm) {
            patientForm.addEventListener('submit', (e) => this.handlePatientSubmit(e));
        }

        const uploadArea = document.getElementById('upload-area');
        const imageInput = document.getElementById('medical-image');
        
        if (uploadArea && imageInput) {
            uploadArea.addEventListener('click', () => imageInput.click());
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
            imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        }

        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.startStage1Validation());
        }
    }

    updateTimestamp() {
        const timeElement = document.getElementById('current-time');
        if (!timeElement) return;
        
        const now = new Date();
        const timestamp = now.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        timeElement.textContent = timestamp;
    }

    async checkSystemStatus() {
        try {
            const [backendResponse, aiResponse] = await Promise.all([
                fetch(`${this.API_BASE_URL}/health`).catch(() => null),
                fetch(`${this.AI_SERVICE_URL}/health`).catch(() => null)
            ]);

            const statusIndicator = document.getElementById('status-indicator');
            const statusText = document.getElementById('system-status');

            if (!statusIndicator || !statusText) return;

            const backendOk = backendResponse?.ok;
            const aiOk = aiResponse?.ok;

            if (backendOk && aiOk) {
                statusIndicator.style.background = 'var(--success)';
                statusText.textContent = 'System Online';
            } else {
                statusIndicator.style.background = 'var(--warning)';
                statusText.textContent = 'System Partial';
            }
        } catch (error) {
            console.error('System status check failed:', error);
        }
    }

    switchTab(tabName) {
        if (!tabName) return;
        
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
    }

    async handlePatientSubmit(e) {
        e.preventDefault();
        
        const patientData = {
            patient_id: document.getElementById('patient-id')?.value.toUpperCase(),
            name: document.getElementById('patient-name')?.value,
            phone: document.getElementById('patient-phone')?.value,
            date_of_birth: document.getElementById('patient-dob')?.value,
            address: document.getElementById('patient-address')?.value
        };

        try {
            const response = await fetch(`${this.API_BASE_URL}/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientData)
            });

            if (response.ok) {
                this.currentPatient = patientData;
                this.showAlert('Patient information saved', 'success');
                this.updateAnalyzeButton();
            } else {
                this.showAlert('Failed to save patient information', 'error');
            }
        } catch (error) {
            this.showAlert('Network error', 'error');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processImageFile(files[0]);
        }
    }

    handleImageSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processImageFile(file);
        }
    }

    processImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showAlert('Please select a valid image file', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this.showAlert('Image file too large. Maximum size is 10MB.', 'error');
            return;
        }

        this.currentImage = file;
        this.stage1Passed = false;
        this.stage1Result = null;

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewContainer = document.getElementById('image-preview-container');
            const preview = document.getElementById('image-preview');
            const info = document.getElementById('image-info');

            if (!previewContainer || !preview || !info) return;

            preview.innerHTML = `<img src="${e.target.result}" alt="Medical Image Preview">`;
            
            info.innerHTML = `
                <h4><i class="fas fa-image"></i> Image Information</h4>
                <div class="info-item"><strong>Filename:</strong> ${file.name}</div>
                <div class="info-item"><strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                <div class="info-item"><strong>Status:</strong> Ready for Validation</div>
            `;

            previewContainer.style.display = 'grid';
        };
        reader.readAsDataURL(file);

        this.updateAnalyzeButton();
    }

    updateAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyze-btn');
        if (!analyzeBtn) return;
        
        const canAnalyze = this.currentPatient && this.currentImage && !this.analysisInProgress;
        
        analyzeBtn.disabled = !canAnalyze;
        
        if (canAnalyze) {
            analyzeBtn.innerHTML = '<i class="fas fa-check-circle"></i> Validate Image (Stage 1)';
        } else if (this.analysisInProgress) {
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
        } else {
            analyzeBtn.innerHTML = '<i class="fas fa-check-circle"></i> Complete Patient Info & Upload Image';
        }
    }

    async startStage1Validation() {
        if (!this.currentPatient || !this.currentImage || this.analysisInProgress) return;

        this.analysisInProgress = true;
        this.updateAnalyzeButton();
        this.showLoading('Analyzing image with BLIP...');

        try {
            const formData = new FormData();
            formData.append('image', this.currentImage);

            const response = await fetch(`${this.AI_SERVICE_URL}/validate`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('[DEBUG] Stage 1 Result:', result);
            this.stage1Result = result;
            this.hideLoading();

            if (result.valid) {
                this.stage1Passed = true;
                console.log('[DEBUG] Stage 1 PASSED - Displaying success');
                this.showAlert('✓ Medical image verified', 'success');
                this.displayStage1Success(result);
            } else {
                this.stage1Passed = false;
                console.log('[DEBUG] Stage 1 FAILED - Displaying failure');
                this.showAlert('✗ ' + result.message, 'error');
                this.displayStage1Failure(result);
            }

        } catch (error) {
            this.hideLoading();
            this.showAlert('Validation failed. Please try again.', 'error');
        } finally {
            this.analysisInProgress = false;
            this.updateAnalyzeButton();
        }
    }

    async startStage2Detection() {
        if (!this.currentImage) return;

        this.showLoading('Detecting disease with AI model...');

        try {
            const formData = new FormData();
            formData.append('image', this.currentImage);

            const response = await fetch(`${this.AI_SERVICE_URL}/detect`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            this.hideLoading();

            if (result.success) {
                this.showAlert('✓ Disease detected', 'success');
                this.displayStage2Success(result);
            } else {
                this.showAlert('✗ ' + result.message, 'error');
                this.displayStage2Failure(result);
            }

        } catch (error) {
            this.hideLoading();
            this.showAlert('Disease detection failed', 'error');
        }
    }

    async proceedToStage2() {
        this.showAlert('Proceeding to Stage 2 with admin override', 'warning');
        await this.startStage2Detection();
    }

    displayStage1Success(result) {
        const resultsPanel = document.getElementById('diagnostic-results');
        const resultsContent = document.getElementById('results-content');

        if (!resultsPanel || !resultsContent) return;

        resultsContent.innerHTML = `
            <div class="medical-card" style="border-left: 4px solid var(--success);">
                <h4 style="color: var(--success);">
                    <i class="fas fa-check-circle"></i> Stage 1: Image Validation - PASSED
                </h4>
                <p style="margin-top: 12px;">Medical image verified successfully</p>
                
                <div style="margin-top: 20px; padding: 16px; background: rgba(0, 198, 255, 0.08); border-radius: 8px; border: 1px solid rgba(0, 198, 255, 0.2);">
                    <h5 style="color: var(--accent-primary); font-size: 13px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        <i class="fas fa-brain"></i> BLIP Image Caption
                    </h5>
                    <p style="color: var(--text-primary); font-size: 14px; font-style: italic;">
                        "${result.caption || 'N/A'}"
                    </p>
                </div>

                <div style="margin-top: 20px; padding: 16px; background: rgba(46, 204, 113, 0.08); border-radius: 8px; border: 1px solid rgba(46, 204, 113, 0.2);">
                    <h5 style="color: var(--success); font-size: 13px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        <i class="fas fa-check-circle"></i> Validation Reason
                    </h5>
                    <p style="color: var(--text-secondary); font-size: 13px;">
                        ${result.reason || 'Biological content detected'}
                    </p>
                </div>

                <div style="margin-top: 20px;">
                    <button onclick="medicalSystem.startStage2Detection()" class="btn-analyze">
                        <i class="fas fa-arrow-right"></i> Proceed to Stage 2 - Disease Detection
                    </button>
                </div>
            </div>
        `;

        resultsPanel.style.display = 'block';
        resultsPanel.scrollIntoView({ behavior: 'smooth' });
    }

    displayStage2Success(result) {
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) return;

        const confidence = (result.confidence * 100).toFixed(1);

        // Append Stage 2 results (keep Stage 1)
        resultsContent.innerHTML += `
            <div class="medical-card" style="border-left: 4px solid var(--success); margin-top: 20px;">
                <h4 style="color: var(--success);">
                    <i class="fas fa-check-circle"></i> Stage 2: Disease Detection - COMPLETED
                </h4>
                
                <div style="margin-top: 20px; padding: 16px; background: rgba(0, 198, 255, 0.08); border-radius: 8px; border: 1px solid rgba(0, 198, 255, 0.2);">
                    <h5 style="color: var(--accent-primary); font-size: 13px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        <i class="fas fa-microscope"></i> Detected Disease
                    </h5>
                    <p style="color: var(--text-primary); font-size: 16px; font-weight: 600;">
                        ${result.disease}
                    </p>
                    <div style="margin-top: 10px; background: var(--bg-tertiary); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${confidence}%; height: 100%; background: linear-gradient(90deg, var(--success), var(--accent-primary));"></div>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 12px; margin-top: 5px;">
                        Confidence: ${confidence}%
                    </p>
                </div>

                <p style="margin-top: 16px; padding: 16px; background: rgba(46, 204, 113, 0.08); border-radius: 6px; border-left: 3px solid var(--success);">
                    <i class="fas fa-arrow-right"></i> <strong>Next Step:</strong> Stage 3 - Vitamin Analysis (Coming Soon)
                </p>
            </div>
        `;
    }

    displayStage2Failure(result) {
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) return;

        // Append Stage 2 failure (keep Stage 1)
        resultsContent.innerHTML += `
            <div class="medical-card" style="border-left: 4px solid var(--error); margin-top: 20px;">
                <h4 style="color: var(--error);">
                    <i class="fas fa-times-circle"></i> Stage 2: Disease Detection - FAILED
                </h4>
                <p style="margin-top: 12px;">${result.message}</p>
                <p style="margin-top: 16px; padding: 16px; background: rgba(255, 77, 79, 0.08); border-radius: 6px; border-left: 3px solid var(--error);">
                    <i class="fas fa-info-circle"></i> Please upload a clearer medical image and try again.
                </p>
            </div>
        `;
    }

    displayStage1Failure(result) {
        const resultsPanel = document.getElementById('diagnostic-results');
        const resultsContent = document.getElementById('results-content');

        if (!resultsPanel || !resultsContent) return;

        resultsContent.innerHTML = `
            <div class="medical-card" style="border-left: 4px solid var(--error);">
                <h4 style="color: var(--error);">
                    <i class="fas fa-times-circle"></i> Stage 1: Image Validation - FAILED
                </h4>
                <p style="margin-top: 12px;">${result.message}</p>
                
                <div style="margin-top: 20px; padding: 16px; background: rgba(0, 198, 255, 0.08); border-radius: 8px; border: 1px solid rgba(0, 198, 255, 0.2);">
                    <h5 style="color: var(--accent-primary); font-size: 13px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        <i class="fas fa-brain"></i> BLIP Image Caption
                    </h5>
                    <p style="color: var(--text-primary); font-size: 14px; font-style: italic;">
                        "${result.caption || 'N/A'}"
                    </p>
                </div>

                <div style="margin-top: 16px; padding: 16px; background: rgba(255, 77, 79, 0.08); border-radius: 8px; border: 1px solid rgba(255, 77, 79, 0.2);">
                    <h5 style="color: var(--error); font-size: 13px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        <i class="fas fa-exclamation-circle"></i> Rejection Reason
                    </h5>
                    <p style="color: var(--text-secondary); font-size: 13px;">
                        ${result.reason || 'Image does not contain biological/medical content'}
                    </p>
                </div>

                <div style="margin-top: 20px;">
                    <button onclick="medicalSystem.proceedToStage2()" class="btn-secondary" style="width: 100%;">
                        <i class="fas fa-user-shield"></i> Admin Override - Proceed to Stage 2
                    </button>
                </div>

                <p style="margin-top: 16px; padding: 16px; background: rgba(255, 77, 79, 0.08); border-radius: 6px; border-left: 3px solid var(--error);">
                    <i class="fas fa-info-circle"></i> Recommended: Upload a clear medical image of a human body part, or use admin override to proceed anyway.
                </p>
            </div>
        `;

        resultsPanel.style.display = 'block';
        resultsPanel.scrollIntoView({ behavior: 'smooth' });
    }

    showLoading(message) {
        const overlay = document.getElementById('loading-overlay');
        const messageEl = document.getElementById('loading-message');
        
        if (overlay && messageEl) {
            messageEl.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;
        
        const alertId = 'alert-' + Date.now();
        
        const alertHtml = `
            <div id="${alertId}" class="alert ${type}">
                <i class="fas fa-${this.getAlertIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) alert.remove();
        }, 5000);
    }

    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    resetDiagnostic() {
        const patientForm = document.getElementById('patient-form');
        if (patientForm) patientForm.reset();
        
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) previewContainer.style.display = 'none';
        
        const resultsPanel = document.getElementById('diagnostic-results');
        if (resultsPanel) resultsPanel.style.display = 'none';
        
        this.currentPatient = null;
        this.currentImage = null;
        this.analysisInProgress = false;
        this.stage1Passed = false;
        this.stage1Result = null;
        this.updateAnalyzeButton();
        
        this.showAlert('Diagnostic session reset', 'info');
    }
}

function resetDiagnostic() {
    if (window.medicalSystem) {
        window.medicalSystem.resetDiagnostic();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.medicalSystem = new MedicalDiagnosticSystem();
});




