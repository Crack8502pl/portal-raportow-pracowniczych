// New Report Form functionality

class ReportForm {
    constructor() {
        this.selectedFiles = [];
        this.workers = [{ employee_id: '', start_time: '', end_time: '', is_creator: false }];
        this.employees = [];
        this.editingReportId = null;
        this.maxTextLength = 300;
        this.allowedFileTypes = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
    }

    async loadEmployees() {
        try {
            const response = await ApiClient.get('/users/employees/list', { limit: 100 });
            if (response.success) {
                this.employees = response.data.employees;
                return this.employees;
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            UIUtils.showError('Błąd podczas ładowania listy pracowników');
        }
        return [];
    }

    async loadReport(reportId) {
        try {
            const response = await ApiClient.get(`/reports/${reportId}`);
            if (response.success) {
                return response.data;
            }
        } catch (error) {
            console.error('Error loading report:', error);
            UIUtils.showError('Błąd podczas ładowania raportu');
        }
        return null;
    }

    render(reportId = null) {
        this.editingReportId = reportId;
        const container = document.getElementById('content-container');
        
        container.innerHTML = `
            <div class="form-container">
                <div class="form-header">
                    <h2>${reportId ? 'Edytuj raport' : 'Nowy raport pracowniczy'}</h2>
                    <p>${reportId ? 'Wprowadź zmiany w raporcie' : 'Wypełnij wszystkie wymagane pola'}</p>
                </div>
                
                <form id="report-form" class="report-form">
                    <div class="form-grid">
                        <div class="form-section">
                            <h3>Informacje podstawowe</h3>
                            
                            <div class="form-group">
                                <label for="report-date">Data raportu <span class="required">*</span>:</label>
                                <input type="date" id="report-date" name="report_date" required>
                                <span class="error-message"></span>
                            </div>
                            
                            <div class="form-group">
                                <label for="object-name">Nazwa obiektu <span class="required">*</span>:</label>
                                <textarea id="object-name" name="object_name" maxlength="${this.maxTextLength}" 
                                         placeholder="Wpisz nazwę obiektu lub lokalizacji..." required></textarea>
                                <span class="error-message"></span>
                            </div>
                            
                            <div class="form-group">
                                <label for="work-description">Wykonane prace <span class="required">*</span>:</label>
                                <textarea id="work-description" name="work_description" maxlength="${this.maxTextLength}" 
                                         placeholder="Opisz wykonane prace..." required></textarea>
                                <span class="error-message"></span>
                            </div>
                            
                            <div class="form-group">
                                <label for="notes">Uwagi/Problemy:</label>
                                <textarea id="notes" name="notes" maxlength="${this.maxTextLength}" 
                                         placeholder="Opcjonalne uwagi lub opisz napotkane problemy..."></textarea>
                                <span class="error-message"></span>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3>Załączniki</h3>
                            
                            <div class="form-group">
                                <label>Dodaj pliki (opcjonalne):</label>
                                <div class="file-upload" id="file-upload">
                                    <input type="file" id="file-input" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx">
                                    <div class="file-upload-content">
                                        <div class="file-upload-icon">📎</div>
                                        <div class="file-upload-text">Przeciągnij pliki tutaj lub kliknij aby wybrać</div>
                                        <div class="file-upload-hint">
                                            Dozwolone: JPG, PNG, PDF, DOC, XLS (max 5MB każdy)
                                        </div>
                                    </div>
                                </div>
                                <div id="file-list" class="file-list"></div>
                                <span class="error-message"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="workers-section" id="workers-section">
                        <h3>Pracownicy na obiekcie <span class="required">*</span></h3>
                        <p>Dodaj wszystkich pracowników, którzy pracowali na obiekcie w tym dniu</p>
                        
                        <div id="workers-container">
                            <!-- Workers will be rendered here -->
                        </div>
                        
                        <button type="button" class="add-worker" onclick="reportForm.addWorker()">
                            ➕ Dodaj pracownika
                        </button>
                        <span class="error-message" id="workers-error"></span>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="button button-secondary" onclick="cancelReportForm()">
                            Anuluj
                        </button>
                        <button type="submit" class="button button-primary" id="submit-report">
                            ${reportId ? 'Zaktualizuj raport' : 'Utwórz raport'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.setupForm();
    }

    async setupForm() {
        // Load employees first
        await this.loadEmployees();

        // Set default date to today
        const dateInput = document.getElementById('report-date');
        dateInput.value = new Date().toISOString().split('T')[0];

        // Setup character counters
        const textareas = ['object-name', 'work-description', 'notes'];
        textareas.forEach(id => {
            const textarea = document.getElementById(id);
            FormUtils.setupCharCounter(textarea, this.maxTextLength);
        });

        // Setup file upload
        this.setupFileUpload();

        // Setup workers section
        this.renderWorkers();

        // Setup form submission
        this.setupFormSubmission();

        // If editing, load report data
        if (this.editingReportId) {
            await this.loadReportData();
        }
    }

    setupFileUpload() {
        const fileUpload = document.getElementById('file-upload');
        const fileInput = document.getElementById('file-input');

        // Setup drag and drop
        FileUploadUtils.setupDragAndDrop(fileUpload, (files) => {
            this.handleFiles(files);
        });

        // Setup file input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
        });

        // Click to select files
        fileUpload.addEventListener('click', () => {
            fileInput.click();
        });
    }

    handleFiles(files) {
        // Validate files
        const errors = FileUploadUtils.validateFiles(files, this.allowedFileTypes, this.maxFileSize);
        
        if (errors.length > 0) {
            UIUtils.showError(errors.join('\n'));
            return;
        }

        // Add files to selection
        files.forEach(file => {
            // Check if file already selected
            const existing = this.selectedFiles.find(f => f.name === file.name && f.size === file.size);
            if (!existing) {
                this.selectedFiles.push(file);
            }
        });

        this.renderFileList();
        
        // Clear input for re-selection
        document.getElementById('file-input').value = '';
    }

    renderFileList() {
        const container = document.getElementById('file-list');
        
        if (this.selectedFiles.length === 0) {
            container.innerHTML = '';
            return;
        }

        const filesHtml = this.selectedFiles.map((file, index) => {
            const preview = FileUploadUtils.createFilePreview(file);
            const removeBtn = preview.querySelector('.file-remove');
            removeBtn.addEventListener('click', () => this.removeFile(index));
            return preview.outerHTML;
        }).join('');

        container.innerHTML = filesHtml;

        // Re-attach event listeners
        container.querySelectorAll('.file-remove').forEach((btn, index) => {
            btn.addEventListener('click', () => this.removeFile(index));
        });
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.renderFileList();
    }

    addWorker() {
        this.workers.push({
            employee_id: '',
            start_time: '',
            end_time: '',
            is_creator: false
        });
        this.renderWorkers();
    }

    removeWorker(index) {
        if (this.workers.length > 1) {
            this.workers.splice(index, 1);
            this.renderWorkers();
        } else {
            UIUtils.showWarning('Musi być co najmniej jeden pracownik');
        }
    }

    renderWorkers() {
        const container = document.getElementById('workers-container');
        const user = AuthManager.getUser();
        
        const workersHtml = this.workers.map((worker, index) => `
            <div class="worker-entry">
                <div class="form-group">
                    <label>Pracownik:</label>
                    <select name="worker-employee-${index}" required onchange="reportForm.updateWorker(${index}, 'employee_id', this.value)">
                        <option value="">Wybierz pracownika</option>
                        ${this.employees.map(emp => 
                            `<option value="${emp.id}" ${worker.employee_id == emp.id ? 'selected' : ''}>
                                ${emp.full_name}${emp.position ? ` - ${emp.position}` : ''}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Godz. rozpoczęcia:</label>
                    <input type="time" name="worker-start-${index}" value="${worker.start_time}" required
                           onchange="reportForm.updateWorker(${index}, 'start_time', this.value)">
                </div>
                
                <div class="form-group">
                    <label>Godz. zakończenia:</label>
                    <input type="time" name="worker-end-${index}" value="${worker.end_time}" required
                           onchange="reportForm.updateWorker(${index}, 'end_time', this.value)">
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="worker-creator-${index}" ${worker.is_creator ? 'checked' : ''}
                               onchange="reportForm.updateWorker(${index}, 'is_creator', this.checked)">
                        Twórca raportu
                    </label>
                </div>
                
                <button type="button" class="worker-remove" onclick="reportForm.removeWorker(${index})"
                        ${this.workers.length <= 1 ? 'disabled' : ''}>
                    🗑️
                </button>
            </div>
        `).join('');

        container.innerHTML = workersHtml;
    }

    updateWorker(index, field, value) {
        if (this.workers[index]) {
            this.workers[index][field] = value;
            
            // If setting is_creator, unset others
            if (field === 'is_creator' && value) {
                this.workers.forEach((w, i) => {
                    if (i !== index) w.is_creator = false;
                });
                this.renderWorkers();
            }
        }
    }

    setupFormSubmission() {
        const form = document.getElementById('report-form');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitForm();
        });
    }

    async submitForm() {
        const form = document.getElementById('report-form');
        FormUtils.clearFieldErrors(form);

        // Collect form data
        const formData = FormUtils.collectFormData(form);

        // Validate basic fields
        if (!this.validateForm(formData)) {
            return;
        }

        // Prepare report data
        const reportData = {
            report_date: formData.report_date,
            object_name: formData.object_name.trim(),
            work_description: formData.work_description.trim(),
            notes: formData.notes?.trim() || '',
            workers: this.workers.filter(w => w.employee_id && w.start_time && w.end_time)
        };

        // Validate workers
        if (reportData.workers.length === 0) {
            document.getElementById('workers-error').textContent = 'Dodaj co najmniej jednego pracownika';
            return;
        }

        // Validate time ranges
        for (let worker of reportData.workers) {
            if (worker.start_time >= worker.end_time) {
                UIUtils.showError('Godzina zakończenia musi być późniejsza niż rozpoczęcia');
                return;
            }
        }

        // Submit form
        let result;
        if (this.editingReportId) {
            result = await employeeDashboard.updateReport(this.editingReportId, reportData, this.selectedFiles);
        } else {
            result = await employeeDashboard.createReport(reportData, this.selectedFiles);
        }

        if (result.success) {
            // Clear form and go back to reports
            this.reset();
            showReports();
        }
    }

    validateForm(formData) {
        let isValid = true;

        // Required fields
        if (!formData.report_date) {
            FormUtils.showFieldError('report_date', 'Data raportu jest wymagana');
            isValid = false;
        }

        if (!formData.object_name?.trim()) {
            FormUtils.showFieldError('object_name', 'Nazwa obiektu jest wymagana');
            isValid = false;
        }

        if (!formData.work_description?.trim()) {
            FormUtils.showFieldError('work_description', 'Opis wykonanych prac jest wymagany');
            isValid = false;
        }

        // Text length validation
        if (formData.object_name?.length > this.maxTextLength) {
            FormUtils.showFieldError('object_name', `Nazwa obiektu nie może przekraczać ${this.maxTextLength} znaków`);
            isValid = false;
        }

        if (formData.work_description?.length > this.maxTextLength) {
            FormUtils.showFieldError('work_description', `Opis prac nie może przekraczać ${this.maxTextLength} znaków`);
            isValid = false;
        }

        if (formData.notes?.length > this.maxTextLength) {
            FormUtils.showFieldError('notes', `Uwagi nie mogą przekraczać ${this.maxTextLength} znaków`);
            isValid = false;
        }

        // Date validation
        const reportDate = new Date(formData.report_date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (reportDate > today) {
            FormUtils.showFieldError('report_date', 'Data raportu nie może być z przyszłości');
            isValid = false;
        }

        return isValid;
    }

    async loadReportData() {
        const report = await this.loadReport(this.editingReportId);
        if (!report) return;

        // Fill form fields
        document.getElementById('report-date').value = report.report_date;
        document.getElementById('object-name').value = report.object_name;
        document.getElementById('work-description').value = report.work_description;
        document.getElementById('notes').value = report.notes || '';

        // Load workers
        if (report.reportWorkers && report.reportWorkers.length > 0) {
            this.workers = report.reportWorkers.map(rw => ({
                employee_id: rw.employee_id,
                start_time: rw.start_time,
                end_time: rw.end_time,
                is_creator: rw.is_creator
            }));
            this.renderWorkers();
        }

        // Update character counters
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.dispatchEvent(new Event('input'));
        });
    }

    reset() {
        this.selectedFiles = [];
        this.workers = [{ employee_id: '', start_time: '', end_time: '', is_creator: false }];
        this.editingReportId = null;
    }
}

// Create global instance
const reportForm = new ReportForm();

// Navigation function
function showNewReport(reportId = null) {
    UIUtils.setActiveNavLink('new-report');
    reportForm.render(reportId);
}

function cancelReportForm() {
    if (reportForm.editingReportId) {
        // Go back to reports list
        showReports();
    } else {
        // Go back to dashboard
        showDashboard();
    }
}