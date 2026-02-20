// Enterprise Medical UI - JavaScript with Complete 3-Stage Pipeline
class MedicalDiagnosticSystem {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.AI_SERVICE_URL = 'http://localhost:5001';
        this.currentPatient = null;
        this.currentImage = null;
        this.analysisInProgress = false;
        this.stage1Passed = false;
        this.stage1Result = null;
        this.stage2Result = null;
        this.editingPatientId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTimestamp();
        this.checkSystemStatus();
        this.loadPatientsDropdown();
        
        setInterval(() => this.updateTimestamp(), 1000);
        setInterval(() => this.checkSystemStatus(), 30000);
    }

    setupEventListeners() {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
                if (e.currentTarget.dataset.tab === 'patients') {
                    this.loadPatients();
                }
            });
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

        const patientModalForm = document.getElementById('patient-modal-form');
        if (patientModalForm) {
            patientModalForm.addEventListener('submit', (e) => this.handlePatientModalSubmit(e));
        }

        const patientSelect = document.getElementById('patient-select');
        if (patientSelect) {
            patientSelect.addEventListener('change', (e) => this.handlePatientSelection(e));
        }

        // Set today's date as default
        const diagnosisDate = document.getElementById('diagnosis-date');
        if (diagnosisDate) {
            diagnosisDate.valueAsDate = new Date();
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
        
        const patientId = document.getElementById('patient-select')?.value;
        const diagnosisDate = document.getElementById('diagnosis-date')?.value;
        
        if (!patientId) {
            this.showAlert('Please select a patient', 'error');
            return;
        }

        // Find patient from loaded list
        const patientSelect = document.getElementById('patient-select');
        const selectedOption = patientSelect.options[patientSelect.selectedIndex];
        
        this.currentPatient = {
            patient_id: patientId,
            name: selectedOption.dataset.name,
            diagnosis_date: diagnosisDate
        };

        this.showAlert('Patient selected successfully', 'success');
        this.updateAnalyzeButton();
    }

    async loadPatientsDropdown() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/patients/all`);
            if (!response.ok) return;
            
            const patients = await response.json();
            const select = document.getElementById('patient-select');
            if (!select) return;

            select.innerHTML = '<option value="">-- Select a patient --</option>';

            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.id} - ${patient.name}`;
                option.dataset.name = patient.name;
                option.dataset.phone = patient.phone || 'N/A';
                option.dataset.dob = patient.date_of_birth || 'N/A';
                option.dataset.address = patient.address || 'N/A';
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load patients:', error);
        }
    }

    handlePatientSelection(e) {
        const select = e.target;
        const selectedOption = select.options[select.selectedIndex];
        const detailsDiv = document.getElementById('patient-details');

        if (!select.value) {
            detailsDiv.style.display = 'none';
            return;
        }

        document.getElementById('detail-id').textContent = select.value;
        document.getElementById('detail-name').textContent = selectedOption.dataset.name;
        document.getElementById('detail-phone').textContent = selectedOption.dataset.phone;
        document.getElementById('detail-dob').textContent = selectedOption.dataset.dob;
        document.getElementById('detail-address').textContent = selectedOption.dataset.address;
        
        detailsDiv.style.display = 'block';
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
        if (!this.currentImage || !this.currentPatient) return;

        this.showLoading('Running Stage 2: Disease Detection...');

        try {
            const formData = new FormData();
            formData.append('image', this.currentImage);

            const response = await fetch(`${this.AI_SERVICE_URL}/detect`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('[DEBUG] Stage 2 Result:', result);
            this.hideLoading();

            if (result.disease) {
                this.stage2Result = result;
                this.showAlert('✓ Disease detected!', 'success');
                this.displayStage2Results(result);
            } else {
                this.showAlert('✗ Detection failed', 'error');
            }

        } catch (error) {
            this.hideLoading();
            console.error('Detection error:', error);
            this.showAlert('Detection failed. Please try again.', 'error');
        }
    }

    async startStage3Analysis() {
        if (!this.currentImage || !this.currentPatient || !this.stage2Result) return;

        this.showLoading('Running Stage 3: Vitamin Analysis...');

        try {
            const formData = new FormData();
            formData.append('patient_id', this.currentPatient.patient_id);
            formData.append('disease', this.stage2Result.disease);
            formData.append('confidence', this.stage2Result.confidence);

            const response = await fetch(`${this.API_BASE_URL}/analyze_stage3`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('[DEBUG] Stage 3 Result:', result);
            this.hideLoading();

            if (result.status === 'success') {
                this.showAlert('✓ Vitamin analysis complete!', 'success');
                this.displayStage3Results(result);
            } else {
                this.showAlert('✗ ' + result.message, 'error');
            }

        } catch (error) {
            this.hideLoading();
            console.error('Analysis error:', error);
            this.showAlert('Analysis failed. Please try again.', 'error');
        }
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

    displayStage2Results(result) {
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) return;

        const confidence = (result.confidence * 100).toFixed(1);

        let html = `
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

                <div style="margin-top: 20px;">
                    <button onclick="medicalSystem.startStage3Analysis()" class="btn-analyze">
                        <i class="fas fa-arrow-right"></i> Continue to Stage 3 - Vitamin Analysis
                    </button>
                </div>
            </div>
        `;

        resultsContent.innerHTML += html;
    }

    displayStage3Results(result) {
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) return;

        let html = '';

        // Stage 3 Results
        if (result.nutrition_recommendations && result.nutrition_recommendations.length > 0) {
            html += `
                <div class="medical-card" style="border-left: 4px solid var(--accent-primary); margin-top: 20px;">
                    <h4 style="color: var(--accent-primary);">
                        <i class="fas fa-pills"></i> Stage 3: Vitamin Analysis - COMPLETED
                    </h4>
                    <p style="margin-top: 12px;">Detected ${result.nutrition_recommendations.length} possible vitamin deficienc${result.nutrition_recommendations.length > 1 ? 'ies' : 'y'}</p>
            `;

            result.nutrition_recommendations.forEach((rec, index) => {
                const percentage = (rec.association_strength * 100).toFixed(0);
                const strengthColor = rec.association_strength >= 0.8 ? 'var(--error)' : rec.association_strength >= 0.6 ? 'var(--warning)' : 'var(--accent-primary)';
                
                html += `
                    <div style="margin: 20px 0; padding: 16px; background: rgba(0,198,255,0.05); border-radius: 8px; border: 1px solid rgba(0,198,255,0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="font-size: 15px; color: var(--text-primary);">${index + 1}. ${rec.vitamin}</strong>
                            <span style="background: ${strengthColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                ${percentage}% Association
                            </span>
                        </div>
                        
                        <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">
                                <i class="fas fa-info-circle"></i> <strong>Medical Note:</strong>
                            </div>
                            <div style="font-size: 13px; color: var(--text-primary); font-style: italic;">
                                ${rec.confidence_note}
                            </div>
                        </div>

                        <div style="margin: 10px 0;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">
                                <i class="fas fa-apple-alt"></i> <strong>Food Sources:</strong>
                            </div>
                            <div style="font-size: 13px; color: var(--text-primary);">
                                ${rec.foods.join(', ')}
                            </div>
                        </div>

                        <div style="margin: 10px 0;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">
                                <i class="fas fa-notes-medical"></i> <strong>Health Notes:</strong>
                            </div>
                            <div style="font-size: 13px; color: var(--text-primary);">
                                ${rec.notes}
                            </div>
                        </div>

                        <div style="margin-top: 10px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; font-size: 11px; color: var(--text-tertiary);">
                            <i class="fas fa-book-medical"></i> Source: ${rec.source_type.replace('_', ' ')}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        } else {
            html += `
                <div class="medical-card" style="border-left: 4px solid var(--warning); margin-top: 20px;">
                    <h4 style="color: var(--warning);">
                        <i class="fas fa-exclamation-triangle"></i> Stage 3: Vitamin Analysis - NO DATA
                    </h4>
                    <p style="margin-top: 12px;">No vitamin deficiency associations found for this condition.</p>
                </div>
            `;
        }

        resultsContent.innerHTML += html;
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
                    <button onclick="medicalSystem.startStage2Detection()" class="btn-secondary" style="width: 100%;">
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
        this.stage2Result = null;
        this.updateAnalyzeButton();
        
        this.showAlert('Diagnostic session reset', 'info');
    }

    // Patient Management Functions
    async loadPatients() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/patients/all`);
            if (!response.ok) {
                throw new Error('Failed to fetch patients');
            }
            const patients = await response.json();
            this.displayPatients(Array.isArray(patients) ? patients : []);
        } catch (error) {
            console.error('Failed to load patients:', error);
            this.showAlert('Failed to load patients', 'error');
            this.displayPatients([]);
        }
    }

    displayPatients(patients) {
        const tbody = document.getElementById('patients-table-body');
        if (!tbody) return;

        if (patients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                        <i class="fas fa-users" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px; display: block;"></i>
                        <p>No patients found. Click "Add New Patient" to get started.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = patients.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.phone || 'N/A'}</td>
                <td>${p.date_of_birth || 'N/A'}</td>
                <td>${p.address || 'N/A'}</td>
                <td>${new Date(p.created_at).toLocaleString()}</td>
                <td>
                    <button class="action-btn" onclick="medicalSystem.editPatient('${p.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="medicalSystem.deletePatient('${p.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    showAddPatientModal() {
        this.editingPatientId = null;
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-user-plus"></i> Add New Patient';
        document.getElementById('modal-submit-text').textContent = 'Save Patient';
        document.getElementById('patient-modal-form').reset();
        document.getElementById('modal-patient-id').value = '';
        document.getElementById('patient-modal').style.display = 'flex';
    }

    closePatientModal() {
        document.getElementById('patient-modal').style.display = 'none';
        this.editingPatientId = null;
    }

    async handlePatientModalSubmit(e) {
        e.preventDefault();

        const patientData = {
            name: document.getElementById('modal-patient-name').value,
            phone: document.getElementById('modal-patient-phone').value,
            date_of_birth: document.getElementById('modal-patient-dob').value,
            address: document.getElementById('modal-patient-address').value
        };

        try {
            let response;
            if (this.editingPatientId) {
                patientData.patient_id = this.editingPatientId;
                response = await fetch(`${this.API_BASE_URL}/patients/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patientData)
                });
            } else {
                response = await fetch(`${this.API_BASE_URL}/patients/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patientData)
                });
            }

            const result = await response.json();
            if (response.ok) {
                this.showAlert(this.editingPatientId ? 'Patient updated successfully' : 'Patient created successfully', 'success');
                this.closePatientModal();
                this.loadPatients();
            } else {
                this.showAlert(result.error || 'Failed to save patient', 'error');
            }
        } catch (error) {
            this.showAlert('Network error', 'error');
        }
    }

    async editPatient(patientId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/patients/${patientId}`);
            const patient = await response.json();

            this.editingPatientId = patientId;
            document.getElementById('modal-title').innerHTML = '<i class="fas fa-user-edit"></i> Edit Patient';
            document.getElementById('modal-submit-text').textContent = 'Update Patient';
            document.getElementById('modal-patient-id').value = patient.id;
            document.getElementById('modal-patient-name').value = patient.name;
            document.getElementById('modal-patient-phone').value = patient.phone || '';
            document.getElementById('modal-patient-dob').value = patient.date_of_birth || '';
            document.getElementById('modal-patient-address').value = patient.address || '';
            document.getElementById('patient-modal').style.display = 'flex';
        } catch (error) {
            this.showAlert('Failed to load patient data', 'error');
        }
    }

    async deletePatient(patientId) {
        if (!confirm(`Are you sure you want to delete patient ${patientId}?`)) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/patients/${patientId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showAlert('Patient deleted successfully', 'success');
                this.loadPatients();
            } else {
                this.showAlert('Failed to delete patient', 'error');
            }
        } catch (error) {
            this.showAlert('Network error', 'error');
        }
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


