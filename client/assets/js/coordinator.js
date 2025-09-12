// Coordinator dashboard functionality

class CoordinatorDashboard {
    constructor() {
        this.allReports = [];
        this.employees = [];
        this.users = [];
        this.currentFilters = {};
        this.currentPage = 1;
    }

    async loadAllReports(filters = {}) {
        try {
            const response = await ApiClient.get('/reports', {
                ...filters,
                page: this.currentPage,
                limit: 20
            });

            if (response.success) {
                this.allReports = response.data.reports;
                this.pagination = response.data.pagination;
                return this.allReports;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error loading all reports:', error);
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

    async loadUsers() {
        try {
            const response = await ApiClient.get('/users', { limit: 100 });

            if (response.success) {
                this.users = response.data.users;
                return this.users;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            UIUtils.showError('Błąd podczas ładowania użytkowników');
            return [];
        }
    }

    async exportReports(filters = {}) {
        try {
            UIUtils.showLoading();
            
            const params = new URLSearchParams({
                type: 'excel',
                ...filters
            });

            // Create download link
            const token = localStorage.getItem('portal_access_token');
            const url = `/api/reports/export?${params.toString()}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `RaportyPracownicze_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
                
                UIUtils.showSuccess('Eksport został pobrany pomyślnie');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            console.error('Error exporting reports:', error);
            UIUtils.showError('Błąd podczas eksportowania raportów');
        } finally {
            UIUtils.hideLoading();
        }
    }

    async createEmployee(employeeData) {
        try {
            UIUtils.showLoading();
            const response = await ApiClient.post('/users/employees', employeeData);

            if (response.success) {
                UIUtils.showSuccess('Pracownik został dodany pomyślnie');
                return { success: true, employee: response.data };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            UIUtils.showError('Błąd podczas dodawania pracownika');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    async updateEmployee(employeeId, employeeData) {
        try {
            UIUtils.showLoading();
            const response = await ApiClient.put(`/users/employees/${employeeId}`, employeeData);

            if (response.success) {
                UIUtils.showSuccess('Pracownik został zaktualizowany pomyślnie');
                return { success: true, employee: response.data };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            UIUtils.showError('Błąd podczas aktualizacji pracownika');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    renderAllReports() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="all-reports-content">
                <div class="content-header">
                    <h1>Wszystkie raporty</h1>
                    <div class="header-actions">
                        <button class="button button-success" onclick="coordinatorDashboard.exportReports(coordinatorDashboard.currentFilters)">
                            📊 Eksportuj do Excel
                        </button>
                    </div>
                </div>
                
                <div class="filter-form">
                    <div class="filter-grid">
                        <div class="form-group">
                            <label for="search-all-reports">Szukaj:</label>
                            <input type="text" id="search-all-reports" placeholder="Nazwa obiektu, opis prac...">
                        </div>
                        <div class="form-group">
                            <label for="date-from-all">Data od:</label>
                            <input type="date" id="date-from-all">
                        </div>
                        <div class="form-group">
                            <label for="date-to-all">Data do:</label>
                            <input type="date" id="date-to-all">
                        </div>
                        <div class="form-group">
                            <label for="status-filter-all">Status:</label>
                            <select id="status-filter-all">
                                <option value="">Wszystkie</option>
                                <option value="sent">Wysłane</option>
                                <option value="draft">Szkice</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="user-filter">Utworzony przez:</label>
                            <select id="user-filter">
                                <option value="">Wszyscy użytkownicy</option>
                            </select>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button type="button" class="button button-secondary" onclick="clearAllReportsFilter()">
                            Wyczyść
                        </button>
                        <button type="button" class="button button-primary" onclick="applyAllReportsFilter()">
                            Filtruj
                        </button>
                    </div>
                </div>
                
                <div id="all-reports-table-container" class="table-container">
                    <!-- Reports table will be rendered here -->
                </div>
                
                <div id="all-reports-pagination">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>
        `;

        this.setupAllReportsFilters();
        this.loadData().then(() => this.renderAllReportsTable());
    }

    async loadData() {
        await Promise.all([
            this.loadAllReports(),
            this.loadUsers()
        ]);
        
        // Populate user filter
        this.populateUserFilter();
    }

    populateUserFilter() {
        const userFilter = document.getElementById('user-filter');
        if (!userFilter) return;

        const usersHtml = this.users.map(user => 
            `<option value="${user.id}">${user.full_name} (${user.login})</option>`
        ).join('');

        userFilter.innerHTML = `
            <option value="">Wszyscy użytkownicy</option>
            ${usersHtml}
        `;
    }

    setupAllReportsFilters() {
        const searchInput = document.getElementById('search-all-reports');
        const dateFromInput = document.getElementById('date-from-all');
        const dateToInput = document.getElementById('date-to-all');
        const statusSelect = document.getElementById('status-filter-all');
        const userSelect = document.getElementById('user-filter');

        if (!searchInput) return;

        // Debounced search
        const debouncedSearch = UIUtils.debounce(() => {
            this.applyAllReportsFilters();
        }, 500);

        searchInput.addEventListener('input', debouncedSearch);
        dateFromInput?.addEventListener('change', () => this.applyAllReportsFilters());
        dateToInput?.addEventListener('change', () => this.applyAllReportsFilters());
        statusSelect?.addEventListener('change', () => this.applyAllReportsFilters());
        userSelect?.addEventListener('change', () => this.applyAllReportsFilters());
    }

    async applyAllReportsFilters() {
        const filters = {
            search: document.getElementById('search-all-reports')?.value.trim(),
            date_from: document.getElementById('date-from-all')?.value,
            date_to: document.getElementById('date-to-all')?.value,
            status: document.getElementById('status-filter-all')?.value,
            created_by: document.getElementById('user-filter')?.value
        };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        this.currentFilters = filters;
        this.currentPage = 1;

        await this.loadAllReports(filters);
        this.renderAllReportsTable();
    }

    renderAllReportsTable() {
        const container = document.getElementById('all-reports-table-container');
        
        if (!this.allReports || this.allReports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Brak raportów</h3>
                    <p>Nie znaleziono raportów spełniających kryteria wyszukiwania.</p>
                </div>
            `;
            return;
        }

        const columns = [
            { key: 'report_date', title: 'Data', sortable: true },
            { key: 'created_by', title: 'Utworzony przez', sortable: true },
            { key: 'object_name', title: 'Nazwa obiektu', sortable: true },
            { key: 'work_description', title: 'Opis prac', sortable: false },
            { key: 'workers_count', title: 'Pracowników', sortable: false },
            { key: 'version', title: 'Wersja', sortable: true },
            { key: 'status', title: 'Status', sortable: true },
            { key: 'actions', title: 'Akcje', sortable: false }
        ];

        const tableData = this.allReports.map(report => ({
            ...report,
            report_date: UIUtils.formatDate(report.report_date),
            created_by: report.createdByUser?.full_name || 'Nieznany',
            object_name: UIUtils.sanitizeHtml(report.object_name),
            work_description: UIUtils.sanitizeHtml(report.work_description.substring(0, 100)) + 
                            (report.work_description.length > 100 ? '...' : ''),
            workers_count: report.reportWorkers?.length || 0,
            status: report.status === 'sent' ? 'Wysłany' : 'Szkic',
            actions: `
                <div class="table-actions">
                    <button class="button button-small button-secondary" onclick="viewReport(${report.id})">
                        Podgląd
                    </button>
                </div>
            `
        }));

        const table = TableUtils.createTable(tableData, columns);
        container.innerHTML = '';
        container.appendChild(table);

        // Render pagination
        if (this.pagination && this.pagination.total_pages > 1) {
            this.renderAllReportsPagination();
        }
    }

    renderAllReportsPagination() {
        const container = document.getElementById('all-reports-pagination');
        const pagination = TableUtils.createPagination(
            this.pagination.current_page,
            this.pagination.total_pages,
            (page) => this.changeAllReportsPage(page)
        );
        container.innerHTML = '';
        container.appendChild(pagination);
    }

    async changeAllReportsPage(page) {
        this.currentPage = page;
        await this.loadAllReports(this.currentFilters);
        this.renderAllReportsTable();
    }

    renderEmployees() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="employees-content">
                <div class="content-header">
                    <h1>Zarządzanie pracownikami</h1>
                    <button class="button button-primary" onclick="showNewEmployeeModal()">
                        ➕ Dodaj pracownika
                    </button>
                </div>
                
                <div class="filter-form">
                    <div class="filter-grid">
                        <div class="form-group">
                            <label for="search-employees">Szukaj pracownika:</label>
                            <input type="text" id="search-employees" placeholder="Imię, nazwisko, stanowisko...">
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button type="button" class="button button-secondary" onclick="clearEmployeesFilter()">
                            Wyczyść
                        </button>
                        <button type="button" class="button button-primary" onclick="applyEmployeesFilter()">
                            Szukaj
                        </button>
                    </div>
                </div>
                
                <div id="employees-table-container" class="table-container">
                    <!-- Employees table will be rendered here -->
                </div>
            </div>
            
            <!-- Employee Modal -->
            <div id="employee-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="employee-modal-title">Dodaj pracownika</h2>
                        <button type="button" class="close-button" onclick="closeEmployeeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="employee-form">
                            <div class="form-group">
                                <label for="employee-full-name">Imię i nazwisko <span class="required">*</span>:</label>
                                <input type="text" id="employee-full-name" name="full_name" required>
                                <span class="error-message"></span>
                            </div>
                            <div class="form-group">
                                <label for="employee-position">Stanowisko:</label>
                                <input type="text" id="employee-position" name="position">
                                <span class="error-message"></span>
                            </div>
                            <div class="form-group">
                                <label for="employee-department">Dział:</label>
                                <input type="text" id="employee-department" name="department">
                                <span class="error-message"></span>
                            </div>
                            <div class="form-group">
                                <label for="employee-email">Email:</label>
                                <input type="email" id="employee-email" name="email">
                                <span class="error-message"></span>
                            </div>
                            <div class="form-group">
                                <label for="employee-phone">Telefon:</label>
                                <input type="tel" id="employee-phone" name="phone">
                                <span class="error-message"></span>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="button button-secondary" onclick="closeEmployeeModal()">Anuluj</button>
                        <button type="submit" form="employee-form" class="button button-primary" id="save-employee-btn">Zapisz</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEmployeesPage();
    }

    async setupEmployeesPage() {
        await this.loadEmployees();
        this.renderEmployeesTable();
        this.setupEmployeeForm();

        // Setup search
        const searchInput = document.getElementById('search-employees');
        const debouncedSearch = UIUtils.debounce(() => {
            this.filterEmployees();
        }, 500);

        searchInput.addEventListener('input', debouncedSearch);
    }

    renderEmployeesTable() {
        const container = document.getElementById('employees-table-container');
        
        if (!this.employees || this.employees.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Brak pracowników</h3>
                    <p>Nie dodano jeszcze żadnych pracowników do systemu.</p>
                    <button class="button button-primary" onclick="showNewEmployeeModal()">
                        ➕ Dodaj pierwszego pracownika
                    </button>
                </div>
            `;
            return;
        }

        const columns = [
            { key: 'full_name', title: 'Imię i nazwisko', sortable: true },
            { key: 'position', title: 'Stanowisko', sortable: true },
            { key: 'department', title: 'Dział', sortable: true },
            { key: 'email', title: 'Email', sortable: false },
            { key: 'phone', title: 'Telefon', sortable: false },
            { key: 'is_active', title: 'Status', sortable: true },
            { key: 'actions', title: 'Akcje', sortable: false }
        ];

        const tableData = this.employees.map(employee => ({
            ...employee,
            full_name: UIUtils.sanitizeHtml(employee.full_name),
            position: UIUtils.sanitizeHtml(employee.position || '-'),
            department: UIUtils.sanitizeHtml(employee.department || '-'),
            email: employee.email || '-',
            phone: employee.phone || '-',
            is_active: employee.is_active ? 'Aktywny' : 'Nieaktywny',
            actions: `
                <div class="table-actions">
                    <button class="button button-small button-primary" onclick="editEmployee(${employee.id})">
                        Edytuj
                    </button>
                </div>
            `
        }));

        const table = TableUtils.createTable(tableData, columns);
        container.innerHTML = '';
        container.appendChild(table);
    }

    filterEmployees() {
        const searchTerm = document.getElementById('search-employees').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.renderEmployeesTable();
            return;
        }

        const filtered = this.employees.filter(emp => 
            emp.full_name.toLowerCase().includes(searchTerm) ||
            (emp.position && emp.position.toLowerCase().includes(searchTerm)) ||
            (emp.department && emp.department.toLowerCase().includes(searchTerm))
        );

        // Temporarily replace employees for rendering
        const originalEmployees = this.employees;
        this.employees = filtered;
        this.renderEmployeesTable();
        this.employees = originalEmployees;
    }

    setupEmployeeForm() {
        const form = document.getElementById('employee-form');
        let editingEmployeeId = null;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            FormUtils.clearFieldErrors(form);
            const formData = FormUtils.collectFormData(form);

            // Basic validation
            if (!formData.full_name?.trim()) {
                FormUtils.showFieldError('full_name', 'Imię i nazwisko jest wymagane');
                return;
            }

            if (formData.email && !FormUtils.validateEmail(formData.email)) {
                FormUtils.showFieldError('email', 'Nieprawidłowy format email');
                return;
            }

            const employeeData = {
                full_name: formData.full_name.trim(),
                position: formData.position?.trim() || null,
                department: formData.department?.trim() || null,
                email: formData.email?.trim() || null,
                phone: formData.phone?.trim() || null
            };

            let result;
            if (editingEmployeeId) {
                result = await this.updateEmployee(editingEmployeeId, employeeData);
            } else {
                result = await this.createEmployee(employeeData);
            }

            if (result.success) {
                closeEmployeeModal();
                await this.loadEmployees();
                this.renderEmployeesTable();
                editingEmployeeId = null;
            }
        });

        // Store reference for editing
        this.editingEmployeeId = null;
        this.setEditingEmployeeId = (id) => { editingEmployeeId = id; };
    }

    renderStatistics() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="statistics-content">
                <div class="content-header">
                    <h1>Statystyki</h1>
                    <p>Przegląd aktywności i statystyk systemowych</p>
                </div>
                
                <div class="dashboard-grid" id="stats-grid">
                    <!-- Stats will be loaded here -->
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Funkcja w przygotowaniu</h3>
                    </div>
                    <div class="card-body">
                        <p>Szczegółowe statystyki i wykresy będą dostępne wkrótce.</p>
                    </div>
                </div>
            </div>
        `;

        this.loadStatisticsData();
    }

    async loadStatisticsData() {
        // This would load comprehensive statistics
        // For now, show basic stats
        UIUtils.showSuccess('Funkcja statystyk będzie dostępna wkrótce');
    }
}

// Create global instance
const coordinatorDashboard = new CoordinatorDashboard();

// Navigation functions
function showAllReports() {
    UIUtils.setActiveNavLink('all-reports');
    coordinatorDashboard.renderAllReports();
}

function showEmployees() {
    UIUtils.setActiveNavLink('employees');
    coordinatorDashboard.renderEmployees();
}

function showStatistics() {
    UIUtils.setActiveNavLink('statistics');
    coordinatorDashboard.renderStatistics();
}

// Filter functions
function clearAllReportsFilter() {
    document.getElementById('search-all-reports').value = '';
    document.getElementById('date-from-all').value = '';
    document.getElementById('date-to-all').value = '';
    document.getElementById('status-filter-all').value = '';
    document.getElementById('user-filter').value = '';
    coordinatorDashboard.applyAllReportsFilters();
}

function applyAllReportsFilter() {
    coordinatorDashboard.applyAllReportsFilters();
}

function clearEmployeesFilter() {
    document.getElementById('search-employees').value = '';
    coordinatorDashboard.renderEmployeesTable();
}

function applyEmployeesFilter() {
    coordinatorDashboard.filterEmployees();
}

// Employee modal functions
function showNewEmployeeModal() {
    document.getElementById('employee-modal-title').textContent = 'Dodaj pracownika';
    document.getElementById('save-employee-btn').textContent = 'Dodaj pracownika';
    FormUtils.clearForm(document.getElementById('employee-form'));
    coordinatorDashboard.setEditingEmployeeId(null);
    document.getElementById('employee-modal').style.display = 'flex';
}

function editEmployee(employeeId) {
    const employee = coordinatorDashboard.employees.find(e => e.id === employeeId);
    if (!employee) return;

    document.getElementById('employee-modal-title').textContent = 'Edytuj pracownika';
    document.getElementById('save-employee-btn').textContent = 'Zaktualizuj';
    
    // Fill form
    document.getElementById('employee-full-name').value = employee.full_name;
    document.getElementById('employee-position').value = employee.position || '';
    document.getElementById('employee-department').value = employee.department || '';
    document.getElementById('employee-email').value = employee.email || '';
    document.getElementById('employee-phone').value = employee.phone || '';
    
    coordinatorDashboard.setEditingEmployeeId(employeeId);
    document.getElementById('employee-modal').style.display = 'flex';
}

function closeEmployeeModal() {
    document.getElementById('employee-modal').style.display = 'none';
    FormUtils.clearForm(document.getElementById('employee-form'));
    coordinatorDashboard.setEditingEmployeeId(null);
}