// Employee dashboard functionality

class EmployeeDashboard {
    constructor() {
        this.reports = [];
        this.employees = [];
        this.currentFilters = {};
        this.currentPage = 1;
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadReports(),
                this.loadEmployees()
            ]);
        } catch (error) {
            console.error('Error loading employee dashboard data:', error);
            UIUtils.showError('Błąd podczas ładowania danych');
        }
    }

    async loadReports(filters = {}) {
        try {
            const response = await ApiClient.get('/reports', {
                ...filters,
                page: this.currentPage,
                limit: 20
            });

            if (response.success) {
                this.reports = response.data.reports;
                this.pagination = response.data.pagination;
                return this.reports;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            UIUtils.showError('Błąd podczas ładowania raportów');
            return [];
        }
    }

    async loadEmployees() {
        try {
            const response = await ApiClient.get('/users/employees/list', { limit: 100 });

            if (response.success) {
                this.employees = response.data.employees;
                return this.employees;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            UIUtils.showError('Błąd podczas ładowania listy pracowników');
            return [];
        }
    }

    async getStats() {
        try {
            const response = await ApiClient.get('/reports/stats');
            if (response.success) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Error loading stats:', error);
            return null;
        }
    }

    async createReport(reportData, files = []) {
        try {
            UIUtils.showLoading();

            const formData = new FormData();
            
            // Add report data
            Object.keys(reportData).forEach(key => {
                if (key === 'workers') {
                    formData.append(key, JSON.stringify(reportData[key]));
                } else {
                    formData.append(key, reportData[key]);
                }
            });

            // Add files
            files.forEach(file => {
                formData.append('attachments', file);
            });

            const response = await ApiClient.upload('/reports', formData);

            if (response.success) {
                UIUtils.showSuccess('Raport został utworzony pomyślnie');
                return { success: true, report: response.data };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error creating report:', error);
            UIUtils.showError('Błąd podczas tworzenia raportu');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    async updateReport(reportId, reportData, files = []) {
        try {
            UIUtils.showLoading();

            const formData = new FormData();
            
            // Add report data
            Object.keys(reportData).forEach(key => {
                if (key === 'workers') {
                    formData.append(key, JSON.stringify(reportData[key]));
                } else {
                    formData.append(key, reportData[key]);
                }
            });

            // Add files
            files.forEach(file => {
                formData.append('attachments', file);
            });

            const response = await ApiClient.upload(`/reports/${reportId}`, formData);

            if (response.success) {
                UIUtils.showSuccess('Raport został zaktualizowany pomyślnie');
                return { success: true, report: response.data };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error updating report:', error);
            UIUtils.showError('Błąd podczas aktualizacji raportu');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    async deleteReport(reportId) {
        try {
            if (!UIUtils.confirmDialog('Czy na pewno chcesz usunąć ten raport?')) {
                return { success: false };
            }

            UIUtils.showLoading();
            const response = await ApiClient.delete(`/reports/${reportId}`);

            if (response.success) {
                UIUtils.showSuccess('Raport został usunięty pomyślnie');
                return { success: true };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            UIUtils.showError('Błąd podczas usuwania raportu');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    renderDashboard() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="dashboard-content">
                <div class="dashboard-header">
                    <h1>Dashboard</h1>
                    <p>Witaj w systemie raportów pracowniczych</p>
                </div>
                
                <div id="stats-container" class="dashboard-grid">
                    <!-- Stats will be loaded here -->
                </div>
                
                <div class="quick-actions">
                    <h3>Szybkie akcje</h3>
                    <div class="actions-grid">
                        <button class="action-button" onclick="showNewReport()">
                            <div class="icon">➕</div>
                            <div class="content">
                                <h4>Nowy raport</h4>
                                <p>Utwórz nowy raport pracowniczy</p>
                            </div>
                        </button>
                        <button class="action-button" onclick="showReports()">
                            <div class="icon">📋</div>
                            <div class="content">
                                <h4>Moje raporty</h4>
                                <p>Przeglądaj swoje raporty</p>
                            </div>
                        </button>
                    </div>
                </div>
                
                <div id="recent-reports" class="recent-activity">
                    <h3>Ostatnie raporty</h3>
                    <div id="recent-reports-content">
                        <!-- Recent reports will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        this.loadDashboardData();
    }

    async loadDashboardData() {
        // Load stats
        const stats = await this.getStats();
        if (stats) {
            this.renderStats(stats);
        }

        // Load recent reports
        await this.loadReports({ limit: 5 });
        this.renderRecentReports();
    }

    renderStats(stats) {
        const container = document.getElementById('stats-container');
        container.innerHTML = `
            <div class="stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">Wszystkie raporty</h3>
                    <span class="stats-icon">📊</span>
                </div>
                <div class="stats-value">${stats.total_reports || 0}</div>
                <p class="stats-description">Łączna liczba Twoich raportów</p>
            </div>
            
            <div class="stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">Ten miesiąc</h3>
                    <span class="stats-icon">📅</span>
                </div>
                <div class="stats-value">${stats.reports_this_month || 0}</div>
                <p class="stats-description">Raporty w bieżącym miesiącu</p>
            </div>
            
            <div class="stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">Ten tydzień</h3>
                    <span class="stats-icon">📈</span>
                </div>
                <div class="stats-value">${stats.reports_this_week || 0}</div>
                <p class="stats-description">Raporty w tym tygodniu</p>
            </div>
            
            <div class="stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">Szkice</h3>
                    <span class="stats-icon">📝</span>
                </div>
                <div class="stats-value">${stats.draft_reports || 0}</div>
                <p class="stats-description">Niezakończone raporty</p>
            </div>
        `;
    }

    renderRecentReports() {
        const container = document.getElementById('recent-reports-content');
        
        if (!this.reports || this.reports.length === 0) {
            container.innerHTML = '<p class="text-muted">Brak ostatnich raportów</p>';
            return;
        }

        const reportsHtml = this.reports.slice(0, 5).map(report => `
            <div class="activity-item">
                <div class="activity-icon report">📋</div>
                <div class="activity-content">
                    <div class="activity-title">${UIUtils.sanitizeHtml(report.object_name)}</div>
                    <div class="activity-description">
                        ${UIUtils.sanitizeHtml(report.work_description.substring(0, 100))}${report.work_description.length > 100 ? '...' : ''}
                    </div>
                    <div class="activity-time">
                        ${UIUtils.formatDate(report.report_date)} • 
                        Wersja ${report.version} • 
                        ${report.status === 'sent' ? 'Wysłany' : 'Szkic'}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="activity-list">
                ${reportsHtml}
            </div>
        `;
    }

    renderReports() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="reports-content">
                <div class="content-header">
                    <h1>Moje raporty</h1>
                    <button class="button button-primary" onclick="showNewReport()">
                        ➕ Nowy raport
                    </button>
                </div>
                
                <div class="filter-form">
                    <div class="filter-grid">
                        <div class="form-group">
                            <label for="search-reports">Szukaj:</label>
                            <input type="text" id="search-reports" placeholder="Nazwa obiektu, opis prac...">
                        </div>
                        <div class="form-group">
                            <label for="date-from">Data od:</label>
                            <input type="date" id="date-from">
                        </div>
                        <div class="form-group">
                            <label for="date-to">Data do:</label>
                            <input type="date" id="date-to">
                        </div>
                        <div class="form-group">
                            <label for="status-filter">Status:</label>
                            <select id="status-filter">
                                <option value="">Wszystkie</option>
                                <option value="sent">Wysłane</option>
                                <option value="draft">Szkice</option>
                            </select>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button type="button" class="button button-secondary" onclick="clearReportsFilter()">
                            Wyczyść
                        </button>
                        <button type="button" class="button button-primary" onclick="applyReportsFilter()">
                            Filtruj
                        </button>
                    </div>
                </div>
                
                <div id="reports-table-container" class="table-container">
                    <!-- Reports table will be rendered here -->
                </div>
                
                <div id="reports-pagination">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>
        `;

        this.setupReportsFilters();
        this.loadReports().then(() => this.renderReportsTable());
    }

    setupReportsFilters() {
        const searchInput = document.getElementById('search-reports');
        const dateFromInput = document.getElementById('date-from');
        const dateToInput = document.getElementById('date-to');
        const statusSelect = document.getElementById('status-filter');

        // Debounced search
        const debouncedSearch = UIUtils.debounce(() => {
            this.applyFilters();
        }, 500);

        searchInput.addEventListener('input', debouncedSearch);
        dateFromInput.addEventListener('change', () => this.applyFilters());
        dateToInput.addEventListener('change', () => this.applyFilters());
        statusSelect.addEventListener('change', () => this.applyFilters());
    }

    async applyFilters() {
        const filters = {
            search: document.getElementById('search-reports').value.trim(),
            date_from: document.getElementById('date-from').value,
            date_to: document.getElementById('date-to').value,
            status: document.getElementById('status-filter').value
        };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        this.currentFilters = filters;
        this.currentPage = 1;

        await this.loadReports(filters);
        this.renderReportsTable();
    }

    renderReportsTable() {
        const container = document.getElementById('reports-table-container');
        
        if (!this.reports || this.reports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Brak raportów</h3>
                    <p>Nie masz jeszcze żadnych raportów. Utwórz pierwszy raport, aby rozpocząć.</p>
                    <button class="button button-primary" onclick="showNewReport()">
                        ➕ Utwórz pierwszy raport
                    </button>
                </div>
            `;
            return;
        }

        const columns = [
            { key: 'report_date', title: 'Data', sortable: true },
            { key: 'object_name', title: 'Nazwa obiektu', sortable: true },
            { key: 'work_description', title: 'Opis prac', sortable: false },
            { key: 'version', title: 'Wersja', sortable: true },
            { key: 'status', title: 'Status', sortable: true },
            { key: 'actions', title: 'Akcje', sortable: false }
        ];

        const tableData = this.reports.map(report => ({
            ...report,
            report_date: UIUtils.formatDate(report.report_date),
            object_name: UIUtils.sanitizeHtml(report.object_name),
            work_description: UIUtils.sanitizeHtml(report.work_description.substring(0, 100)) + 
                            (report.work_description.length > 100 ? '...' : ''),
            status: report.status === 'sent' ? 'Wysłany' : 'Szkic',
            actions: `
                <div class="table-actions">
                    <button class="button button-small button-secondary" onclick="viewReport(${report.id})">
                        Podgląd
                    </button>
                    <button class="button button-small button-primary" onclick="editReport(${report.id})">
                        Edytuj
                    </button>
                    <button class="button button-small button-danger" onclick="deleteReportById(${report.id})">
                        Usuń
                    </button>
                </div>
            `
        }));

        const table = TableUtils.createTable(tableData, columns);
        container.innerHTML = '';
        container.appendChild(table);

        // Render pagination
        if (this.pagination && this.pagination.total_pages > 1) {
            this.renderPagination();
        }
    }

    renderPagination() {
        const container = document.getElementById('reports-pagination');
        const pagination = TableUtils.createPagination(
            this.pagination.current_page,
            this.pagination.total_pages,
            (page) => this.changePage(page)
        );
        container.innerHTML = '';
        container.appendChild(pagination);
    }

    async changePage(page) {
        this.currentPage = page;
        await this.loadReports(this.currentFilters);
        this.renderReportsTable();
    }
}

// Create global instance
const employeeDashboard = new EmployeeDashboard();

// Navigation functions
function showDashboard() {
    UIUtils.setActiveNavLink('dashboard');
    employeeDashboard.renderDashboard();
}

function showReports() {
    UIUtils.setActiveNavLink('reports');
    employeeDashboard.renderReports();
}

// Filter functions
function clearReportsFilter() {
    document.getElementById('search-reports').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('status-filter').value = '';
    employeeDashboard.applyFilters();
}

function applyReportsFilter() {
    employeeDashboard.applyFilters();
}

// Report actions
async function viewReport(reportId) {
    try {
        UIUtils.showLoading();
        const response = await ApiClient.get(`/reports/${reportId}`);
        
        if (response.success) {
            showReportDetails(response.data);
        } else {
            UIUtils.showError('Błąd podczas ładowania raportu');
        }
    } catch (error) {
        console.error('Error viewing report:', error);
        UIUtils.showError('Błąd podczas ładowania raportu');
    } finally {
        UIUtils.hideLoading();
    }
}

function showReportDetails(report) {
    // This will be implemented with a modal or detailed view
    console.log('Show report details:', report);
    UIUtils.showSuccess('Funkcja podglądu zostanie wkrótce dodana');
}

function editReport(reportId) {
    // Navigate to edit form
    showNewReport(reportId);
}

async function deleteReportById(reportId) {
    const result = await employeeDashboard.deleteReport(reportId);
    if (result.success) {
        // Refresh the reports list
        await employeeDashboard.loadReports(employeeDashboard.currentFilters);
        employeeDashboard.renderReportsTable();
    }
}