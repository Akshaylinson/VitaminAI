// Patient Dashboard JavaScript
class PatientDashboard {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.currentPatientId = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
        });
    }

    switchTab(tabName) {
        if (!tabName) return;
        
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
    }

    checkExistingSession() {
        const savedPatientId = sessionStorage.getItem('patient_id');
        if (savedPatientId) {
            this.currentPatientId = savedPatientId;
            this.showDashboard();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const patientId = document.getElementById('login-patient-id').value.trim().toUpperCase();
        
        if (!patientId) {
            this.showAlert('Please enter your Patient ID', 'error');
            return;
        }

        this.showLoading('Verifying Patient ID...');

        try {
            const response = await fetch(`${this.API_BASE_URL}/patients/${patientId}`);
            
            if (response.ok) {
                const patient = await response.json();
                this.currentPatientId = patientId;
                sessionStorage.setItem('patient_id', patientId);
                this.hideLoading();
                this.showAlert('Login successful!', 'success');
                this.showDashboard();
            } else {
                this.hideLoading();
                this.showAlert('Patient ID not found. Please check and try again.', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showAlert('Connection error. Please try again.', 'error');
        }
    }

    async showDashboard() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('patient-header').style.display = 'flex';
        document.getElementById('logged-patient-id').textContent = this.currentPatientId;

        await this.loadPatientInfo();
        await this.loadReports();
        await this.loadAnalytics();
    }

    async loadPatientInfo() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/patients/${this.currentPatientId}`);
            const patient = await response.json();

            const infoCard = document.getElementById('patient-info-card');
            infoCard.innerHTML = `
                <h4 style="color: var(--accent-primary); margin-bottom: 16px;">
                    <i class="fas fa-user"></i> Patient Information
                </h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Patient ID</strong>
                        <span>${patient.id}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Name</strong>
                        <span>${patient.name}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Phone</strong>
                        <span>${patient.phone || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Date of Birth</strong>
                        <span>${patient.date_of_birth || 'N/A'}</span>
                    </div>
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <strong>Address</strong>
                        <span>${patient.address || 'N/A'}</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Failed to load patient info:', error);
        }
    }

    async loadReports() {
        this.showLoading('Loading your medical reports...');

        try {
            const response = await fetch(`${this.API_BASE_URL}/reports/${this.currentPatientId}`);
            const reports = await response.json();

            this.hideLoading();
            this.displayLatestReport(reports);
            this.displayHistory(reports);
        } catch (error) {
            this.hideLoading();
            this.showAlert('Failed to load reports', 'error');
        }
    }

    displayLatestReport(reports) {
        const container = document.getElementById('reports-container');

        if (reports.length === 0) {
            container.innerHTML = `
                <div class="medical-card" style="text-align: center; padding: 60px 40px;">
                    <i class="fas fa-file-medical" style="font-size: 64px; color: var(--text-tertiary); opacity: 0.3; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--text-secondary); font-size: 18px; margin-bottom: 8px;">No Reports Found</h3>
                    <p style="color: var(--text-tertiary); font-size: 14px;">You don't have any medical reports yet.</p>
                </div>
            `;
            return;
        }

        // Show only the latest report (first one)
        const report = reports[0];
        const date = new Date(report.created_at).toLocaleString();
        const confidence = (report.confidence_score * 100).toFixed(1);

        container.innerHTML = `
            <div class="medical-card" style="border-left: 4px solid var(--accent-primary);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                    <div>
                        <h3 style="color: var(--text-primary); font-size: 18px; margin-bottom: 8px;">
                            <i class="fas fa-file-medical-alt"></i> Latest Report
                        </h3>
                        <p style="color: var(--text-tertiary); font-size: 12px;">
                            <i class="fas fa-clock"></i> ${date}
                        </p>
                    </div>
                    <span style="background: var(--success); color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600;">
                        LATEST
                    </span>
                </div>

                <div style="padding: 16px; background: rgba(0, 198, 255, 0.05); border-radius: 8px; border: 1px solid rgba(0, 198, 255, 0.2); margin-bottom: 20px;">
                    <h5 style="color: var(--accent-primary); font-size: 13px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                        <i class="fas fa-microscope"></i> Detected Condition
                    </h5>
                    <p style="color: var(--text-primary); font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                        ${report.detected_disease}
                    </p>
                    <div style="background: var(--bg-tertiary); height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${confidence}%; height: 100%; background: linear-gradient(90deg, var(--success), var(--accent-primary));"></div>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 11px; margin-top: 5px;">
                        Confidence: ${confidence}%
                    </p>
                </div>

                ${this.renderVitaminDeficiencies(report.nutrition_recommendations)}
            </div>
        `;
    }

    displayHistory(reports) {
        const container = document.getElementById('history-container');

        if (reports.length === 0) {
            container.innerHTML = `
                <div class="medical-card" style="text-align: center; padding: 40px;">
                    <i class="fas fa-history" style="font-size: 48px; color: var(--text-tertiary); opacity: 0.3; margin-bottom: 16px;"></i>
                    <p style="color: var(--text-tertiary); font-size: 14px;">No diagnosis history available.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="medical-card">
                <h4 style="color: var(--accent-primary); margin-bottom: 20px; font-size: 15px;">
                    <i class="fas fa-calendar-alt"></i> Total Diagnoses: ${reports.length}
                </h4>
                <div class="history-timeline">
                    ${reports.map((report, index) => {
                        const date = new Date(report.created_at);
                        const dateStr = date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        });
                        const timeStr = date.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                        
                        return `
                            <div class="history-item">
                                <div class="history-marker">${reports.length - index}</div>
                                <div class="history-content">
                                    <div class="history-date">
                                        <i class="fas fa-calendar"></i> ${dateStr}
                                    </div>
                                    <div class="history-time">
                                        <i class="fas fa-clock"></i> ${timeStr}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderVitaminDeficiencies(recommendations) {
        if (!recommendations || recommendations.length === 0) {
            return `
                <div style="padding: 16px; background: rgba(255, 184, 0, 0.08); border-radius: 8px; border: 1px solid rgba(255, 184, 0, 0.2);">
                    <p style="color: var(--warning); font-size: 13px;">
                        <i class="fas fa-info-circle"></i> No vitamin deficiency associations found for this condition.
                    </p>
                </div>
            `;
        }

        return `
            <div>
                <h5 style="color: var(--accent-primary); font-size: 13px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
                    <i class="fas fa-pills"></i> Possible Vitamin Deficiencies (${recommendations.length})
                </h5>
                ${recommendations.map((rec, index) => {
                    const percentage = (rec.association_strength * 100).toFixed(0);
                    const strengthColor = rec.association_strength >= 0.8 ? 'var(--error)' : rec.association_strength >= 0.6 ? 'var(--warning)' : 'var(--accent-primary)';
                    
                    return `
                        <div style="margin: 12px 0; padding: 16px; background: rgba(0,198,255,0.03); border-radius: 8px; border: 1px solid rgba(0,198,255,0.15);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <strong style="font-size: 15px; color: var(--text-primary);">${index + 1}. ${rec.vitamin}</strong>
                                <span style="background: ${strengthColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                    ${percentage}% Association
                                </span>
                            </div>
                            
                            <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 6px;">
                                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 5px;">
                                    <i class="fas fa-info-circle"></i> <strong>Medical Note:</strong>
                                </div>
                                <div style="font-size: 13px; color: var(--text-primary); font-style: italic;">
                                    ${rec.confidence_note}
                                </div>
                            </div>

                            <div style="margin: 10px 0;">
                                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 5px;">
                                    <i class="fas fa-apple-alt"></i> <strong>Food Sources:</strong>
                                </div>
                                <div style="font-size: 13px; color: var(--text-primary);">
                                    ${rec.foods.join(', ')}
                                </div>
                            </div>

                            <div style="margin: 10px 0;">
                                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 5px;">
                                    <i class="fas fa-notes-medical"></i> <strong>Health Notes:</strong>
                                </div>
                                <div style="font-size: 13px; color: var(--text-primary);">
                                    ${rec.notes}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    async loadAnalytics() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/analytics/${this.currentPatientId}`);
            const data = await response.json();

            if (Object.keys(data.vitamins).length === 0 && Object.keys(data.diseases).length === 0) {
                this.showEmptyAnalytics();
                return;
            }

            this.renderVitaminsChart(data.vitamins);
            this.renderDiseasesChart(data.diseases);
            this.renderMonthlyChart(data.monthly);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showEmptyAnalytics();
        }
    }

    showEmptyAnalytics() {
        const graphsTab = document.getElementById('graphs-tab');
        const chartsGrid = graphsTab.querySelector('.charts-grid');
        chartsGrid.innerHTML = `
            <div class="medical-card" style="grid-column: 1 / -1; text-align: center; padding: 60px 40px;">
                <i class="fas fa-chart-line" style="font-size: 64px; color: var(--text-tertiary); opacity: 0.3; margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-secondary); font-size: 18px; margin-bottom: 8px;">No Analytics Data</h3>
                <p style="color: var(--text-tertiary); font-size: 14px;">Complete at least one diagnosis to view analytics.</p>
            </div>
        `;
    }

    renderVitaminsChart(vitamins) {
        const ctx = document.getElementById('vitaminsChart');
        if (!ctx) return;

        if (this.charts.vitamins) this.charts.vitamins.destroy();

        const labels = Object.keys(vitamins);
        const values = Object.values(vitamins);

        this.charts.vitamins = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Occurrences',
                    data: values,
                    backgroundColor: 'rgba(0, 198, 255, 0.7)',
                    borderColor: 'rgba(0, 198, 255, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#00C6FF',
                        bodyColor: '#fff',
                        borderColor: '#00C6FF',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#B0B0B0',
                            stepSize: 1
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#B0B0B0' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    renderDiseasesChart(diseases) {
        const ctx = document.getElementById('diseasesChart');
        if (!ctx) return;

        if (this.charts.diseases) this.charts.diseases.destroy();

        const labels = Object.keys(diseases);
        const values = Object.values(diseases);
        const colors = [
            'rgba(0, 198, 255, 0.8)',
            'rgba(46, 204, 113, 0.8)',
            'rgba(255, 184, 0, 0.8)',
            'rgba(255, 77, 79, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(52, 152, 219, 0.8)'
        ];

        this.charts.diseases = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#1A1A1A',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#B0B0B0',
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#00C6FF',
                        bodyColor: '#fff',
                        borderColor: '#00C6FF',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    renderMonthlyChart(monthly) {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        if (this.charts.monthly) this.charts.monthly.destroy();

        const labels = Object.keys(monthly).map(m => {
            const [year, month] = m.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        const values = Object.values(monthly);

        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Diagnoses',
                    data: values,
                    borderColor: 'rgba(0, 198, 255, 1)',
                    backgroundColor: 'rgba(0, 198, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(0, 198, 255, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#00C6FF',
                        bodyColor: '#fff',
                        borderColor: '#00C6FF',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#B0B0B0',
                            stepSize: 1
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#B0B0B0' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    logout() {
        sessionStorage.removeItem('patient_id');
        this.currentPatientId = null;
        document.getElementById('login-section').style.display = 'flex';
        document.getElementById('dashboard-section').style.display = 'none';
        document.getElementById('patient-header').style.display = 'none';
        document.getElementById('login-form').reset();
        this.showAlert('Logged out successfully', 'info');
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
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const alertHtml = `
            <div id="${alertId}" class="alert ${type}">
                <i class="fas fa-${icons[type]}"></i>
                <span>${message}</span>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) alert.remove();
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.patientDashboard = new PatientDashboard();
});
