// Admin dashboard functionality

class AdminDashboard {
    constructor() {
        this.users = [];
        this.settings = {};
        this.activityLogs = [];
        this.systemStats = {};
        this.currentPage = 1;
    }

    async loadUsers() {
        try {
            const response = await ApiClient.get('/users', { limit: 100 });
            if (response.success) {
                this.users = response.data.users;
                return this.users;
            }
        } catch (error) {
            console.error('Error loading users:', error);
            UIUtils.showError('Błąd podczas ładowania użytkowników');
        }
        return [];
    }

    async loadSystemSettings() {
        try {
            const response = await ApiClient.get('/admin/settings');
            if (response.success) {
                this.settings = response.data;
                return this.settings;
            }
        } catch (error) {
            console.error('Error loading system settings:', error);
            UIUtils.showError('Błąd podczas ładowania ustawień systemowych');
        }
        return {};
    }

    async updateSystemSettings(settings) {
        try {
            UIUtils.showLoading();
            const response = await ApiClient.put('/admin/settings', settings);

            if (response.success) {
                UIUtils.showSuccess('Ustawienia systemowe zostały zaktualizowane');
                return { success: true };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error updating system settings:', error);
            UIUtils.showError('Błąd podczas aktualizacji ustawień');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    async loadActivityLogs() {
        try {
            const response = await ApiClient.get('/admin/activity-logs', {
                page: this.currentPage,
                limit: 50
            });

            if (response.success) {
                this.activityLogs = response.data.logs;
                this.logsPagination = response.data.pagination;
                return this.activityLogs;
            }
        } catch (error) {
            console.error('Error loading activity logs:', error);
            UIUtils.showError('Błąd podczas ładowania logów aktywności');
        }
        return [];
    }

    async loadSystemStats() {
        try {
            const response = await ApiClient.get('/admin/stats');
            if (response.success) {
                this.systemStats = response.data;
                return this.systemStats;
            }
        } catch (error) {
            console.error('Error loading system stats:', error);
            UIUtils.showError('Błąd podczas ładowania statystyk systemowych');
        }
        return {};
    }

    async loadSystemHealth() {
        try {
            const response = await ApiClient.get('/admin/health');
            if (response.success) {
                return response.data;
            }
        } catch (error) {
            console.error('Error loading system health:', error);
            UIUtils.showError('Błąd podczas sprawdzania stanu systemu');
        }
        return null;
    }

    async createUser(userData) {
        try {
            UIUtils.showLoading();
            const response = await ApiClient.post('/users', userData);

            if (response.success) {
                UIUtils.showSuccess('Użytkownik został utworzony pomyślnie');
                return { success: true, user: response.data };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error creating user:', error);
            UIUtils.showError('Błąd podczas tworzenia użytkownika');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    async updateUser(userId, userData) {
        try {
            UIUtils.showLoading();
            const response = await ApiClient.put(`/users/${userId}`, userData);

            if (response.success) {
                UIUtils.showSuccess('Użytkownik został zaktualizowany pomyślnie');
                return { success: true, user: response.data };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error updating user:', error);
            UIUtils.showError('Błąd podczas aktualizacji użytkownika');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    async deleteUser(userId) {
        try {
            if (!UIUtils.confirmDialog('Czy na pewno chcesz usunąć tego użytkownika?')) {
                return { success: false };
            }

            UIUtils.showLoading();
            const response = await ApiClient.delete(`/users/${userId}`);

            if (response.success) {
                UIUtils.showSuccess('Użytkownik został usunięty pomyślnie');
                return { success: true };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            UIUtils.showError('Błąd podczas usuwania użytkownika');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    async resetUserPassword(userId, newPassword) {
        try {
            UIUtils.showLoading();
            const response = await ApiClient.post(`/users/${userId}/reset-password`, {
                new_password: newPassword
            });

            if (response.success) {
                UIUtils.showSuccess('Hasło zostało zresetowane pomyślnie');
                return { success: true };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            UIUtils.showError('Błąd podczas resetowania hasła');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    renderUsers() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="users-content">
                <div class="content-header">
                    <h1>Zarządzanie użytkownikami</h1>
                    <button class="button button-primary" onclick="showNewUserModal()">
                        ➕ Dodaj użytkownika
                    </button>
                </div>
                
                <div id="users-table-container" class="table-container">
                    <!-- Users table will be rendered here -->
                </div>
            </div>
            
            <!-- User Modal -->
            <div id="user-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="user-modal-title">Dodaj użytkownika</h2>
                        <button type="button" class="close-button" onclick="closeUserModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="user-form">
                            <div class="form-group">
                                <label for="user-login">Login <span class="required">*</span>:</label>
                                <input type="text" id="user-login" name="login" required>
                                <span class="error-message"></span>
                            </div>
                            <div class="form-group">
                                <label for="user-password">Hasło <span class="required">*</span>:</label>
                                <input type="password" id="user-password" name="password" required>
                                <span class="error-message"></span>
                            </div>
                            <div class="form-group">
                                <label for="user-full-name">Imię i nazwisko <span class="required">*</span>:</label>
                                <input type="text" id="user-full-name" name="full_name" required>
                                <span class="error-message"></span>
                            </div>
                            <div class="form-group">
                                <label for="user-email">Email <span class="required">*</span>:</label>
                                <input type="email" id="user-email" name="email" required>
                                <span class="error-message"></span>
                            </div>
                            <div class="form-group">
                                <label for="user-role">Rola <span class="required">*</span>:</label>
                                <select id="user-role" name="role" required>
                                    <option value="">Wybierz rolę</option>
                                    <option value="employee">Pracownik</option>
                                    <option value="coordinator">Koordynator</option>
                                    <option value="admin">Administrator</option>
                                </select>
                                <span class="error-message"></span>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="user-is-active" name="is_active" checked>
                                    Konto aktywne
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="button button-secondary" onclick="closeUserModal()">Anuluj</button>
                        <button type="submit" form="user-form" class="button button-primary" id="save-user-btn">Zapisz</button>
                    </div>
                </div>
            </div>
        `;

        this.setupUsersPage();
    }

    async setupUsersPage() {
        await this.loadUsers();
        this.renderUsersTable();
        this.setupUserForm();
    }

    renderUsersTable() {
        const container = document.getElementById('users-table-container');
        
        if (!this.users || this.users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Brak użytkowników</h3>
                    <p>Nie ma jeszcze żadnych użytkowników w systemie.</p>
                </div>
            `;
            return;
        }

        const columns = [
            { key: 'login', title: 'Login', sortable: true },
            { key: 'full_name', title: 'Imię i nazwisko', sortable: true },
            { key: 'email', title: 'Email', sortable: true },
            { key: 'role', title: 'Rola', sortable: true },
            { key: 'is_active', title: 'Status', sortable: true },
            { key: 'last_login', title: 'Ostatnie logowanie', sortable: true },
            { key: 'actions', title: 'Akcje', sortable: false }
        ];

        const tableData = this.users.map(user => ({
            ...user,
            role: this.getRoleDisplayName(user.role),
            is_active: user.is_active ? 'Aktywny' : 'Nieaktywny',
            last_login: user.last_login ? UIUtils.formatDateTime(user.last_login) : 'Nigdy',
            actions: `
                <div class="table-actions">
                    <button class="button button-small button-primary" onclick="editUser(${user.id})">
                        Edytuj
                    </button>
                    <button class="button button-small button-warning" onclick="resetUserPassword(${user.id})">
                        Reset hasła
                    </button>
                    <button class="button button-small button-danger" onclick="deleteUserById(${user.id})">
                        Usuń
                    </button>
                </div>
            `
        }));

        const table = TableUtils.createTable(tableData, columns);
        container.innerHTML = '';
        container.appendChild(table);
    }

    setupUserForm() {
        const form = document.getElementById('user-form');
        let editingUserId = null;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            FormUtils.clearFieldErrors(form);
            const formData = FormUtils.collectFormData(form);

            // Basic validation
            if (!formData.login?.trim()) {
                FormUtils.showFieldError('login', 'Login jest wymagany');
                return;
            }

            if (!editingUserId && !formData.password) {
                FormUtils.showFieldError('password', 'Hasło jest wymagane');
                return;
            }

            if (!formData.full_name?.trim()) {
                FormUtils.showFieldError('full_name', 'Imię i nazwisko jest wymagane');
                return;
            }

            if (!formData.email?.trim()) {
                FormUtils.showFieldError('email', 'Email jest wymagany');
                return;
            }

            if (!FormUtils.validateEmail(formData.email)) {
                FormUtils.showFieldError('email', 'Nieprawidłowy format email');
                return;
            }

            if (!formData.role) {
                FormUtils.showFieldError('role', 'Rola jest wymagana');
                return;
            }

            const userData = {
                login: formData.login.trim().toLowerCase(),
                full_name: formData.full_name.trim(),
                email: formData.email.trim(),
                role: formData.role,
                is_active: document.getElementById('user-is-active').checked
            };

            if (formData.password) {
                userData.password = formData.password;
            }

            let result;
            if (editingUserId) {
                result = await this.updateUser(editingUserId, userData);
            } else {
                result = await this.createUser(userData);
            }

            if (result.success) {
                closeUserModal();
                await this.loadUsers();
                this.renderUsersTable();
                editingUserId = null;
            }
        });

        // Store reference for editing
        this.setEditingUserId = (id) => { editingUserId = id; };
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'employee': 'Pracownik',
            'coordinator': 'Koordynator',
            'admin': 'Administrator'
        };
        return roleNames[role] || role;
    }

    renderSystemSettings() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="settings-content">
                <div class="content-header">
                    <h1>Ustawienia systemu</h1>
                    <p>Konfiguracja parametrów systemowych</p>
                </div>
                
                <form id="settings-form" class="form-container">
                    <div class="form-section">
                        <h3>Ustawienia SMTP</h3>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="smtp-host">Host SMTP:</label>
                                <input type="text" id="smtp-host" name="smtp_host">
                            </div>
                            <div class="form-group">
                                <label for="smtp-port">Port SMTP:</label>
                                <input type="number" id="smtp-port" name="smtp_port">
                            </div>
                            <div class="form-group">
                                <label for="smtp-user">Użytkownik SMTP:</label>
                                <input type="text" id="smtp-user" name="smtp_user">
                            </div>
                            <div class="form-group">
                                <label for="smtp-password">Hasło SMTP:</label>
                                <input type="password" id="smtp-password" name="smtp_password">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="smtp-secure" name="smtp_secure">
                                Bezpieczne połączenie (SSL/TLS)
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <button type="button" class="button button-secondary" onclick="testEmailConnection()">
                                🧪 Testuj połączenie email
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3>Ustawienia email</h3>
                        
                        <div class="form-group">
                            <label for="email-from">Nadawca email:</label>
                            <input type="email" id="email-from" name="email_from">
                        </div>
                        <div class="form-group">
                            <label for="email-recipients">Odbiorcy (rozdzielone przecinkami):</label>
                            <textarea id="email-recipients" name="email_recipients" rows="3"></textarea>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3>Ustawienia plików</h3>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="max-file-size">Maksymalny rozmiar pliku (MB):</label>
                                <input type="number" id="max-file-size" name="max_file_size" min="1" max="100">
                            </div>
                            <div class="form-group">
                                <label for="allowed-extensions">Dozwolone rozszerzenia (rozdzielone przecinkami):</label>
                                <input type="text" id="allowed-extensions" name="allowed_extensions">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3>Inne ustawienia</h3>
                        
                        <div class="form-group">
                            <label for="text-field-max-length">Maksymalna długość pól tekstowych:</label>
                            <input type="number" id="text-field-max-length" name="text_field_max_length" min="100" max="1000">
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="enable-email-notifications" name="enable_email_notifications">
                                Włącz powiadomienia email
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="button button-primary">
                            💾 Zapisz ustawienia
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.setupSettingsPage();
    }

    async setupSettingsPage() {
        await this.loadSystemSettings();
        this.populateSettingsForm();
        this.setupSettingsForm();
    }

    populateSettingsForm() {
        // Populate form with current settings
        Object.keys(this.settings).forEach(key => {
            const element = document.getElementById(key.replace(/_/g, '-'));
            if (element) {
                const setting = this.settings[key];
                if (element.type === 'checkbox') {
                    element.checked = setting.value === 'true';
                } else if (element.type === 'number') {
                    element.value = parseInt(setting.value) || 0;
                } else {
                    element.value = setting.value || '';
                }
            }
        });
    }

    setupSettingsForm() {
        const form = document.getElementById('settings-form');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = FormUtils.collectFormData(form);
            
            // Convert form data to settings format
            const settings = {};
            Object.keys(formData).forEach(key => {
                const element = document.getElementById(key.replace(/_/g, '-'));
                if (element?.type === 'checkbox') {
                    settings[key] = element.checked ? 'true' : 'false';
                } else {
                    settings[key] = formData[key];
                }
            });

            const result = await this.updateSystemSettings(settings);
            if (result.success) {
                await this.loadSystemSettings();
            }
        });
    }

    renderActivityLogs() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="activity-logs-content">
                <div class="content-header">
                    <h1>Logi aktywności</h1>
                    <p>Historia akcji wykonanych w systemie</p>
                </div>
                
                <div id="activity-logs-table-container" class="table-container">
                    <!-- Activity logs table will be rendered here -->
                </div>
                
                <div id="activity-logs-pagination">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>
        `;

        this.setupActivityLogsPage();
    }

    async setupActivityLogsPage() {
        await this.loadActivityLogs();
        this.renderActivityLogsTable();
    }

    renderActivityLogsTable() {
        const container = document.getElementById('activity-logs-table-container');
        
        if (!this.activityLogs || this.activityLogs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Brak logów aktywności</h3>
                    <p>Nie znaleziono żadnych logów aktywności.</p>
                </div>
            `;
            return;
        }

        const columns = [
            { key: 'created_at', title: 'Data i czas', sortable: true },
            { key: 'user', title: 'Użytkownik', sortable: false },
            { key: 'action', title: 'Akcja', sortable: true },
            { key: 'resource_type', title: 'Typ zasobu', sortable: true },
            { key: 'ip_address', title: 'Adres IP', sortable: false }
        ];

        const tableData = this.activityLogs.map(log => ({
            ...log,
            created_at: UIUtils.formatDateTime(log.created_at),
            user: log.user?.full_name || 'System',
            action: log.action,
            resource_type: log.resource_type || '-',
            ip_address: log.ip_address || '-'
        }));

        const table = TableUtils.createTable(tableData, columns);
        container.innerHTML = '';
        container.appendChild(table);

        // Render pagination
        if (this.logsPagination && this.logsPagination.total_pages > 1) {
            this.renderActivityLogsPagination();
        }
    }

    renderActivityLogsPagination() {
        const container = document.getElementById('activity-logs-pagination');
        const pagination = TableUtils.createPagination(
            this.logsPagination.current_page,
            this.logsPagination.total_pages,
            (page) => this.changeActivityLogsPage(page)
        );
        container.innerHTML = '';
        container.appendChild(pagination);
    }

    async changeActivityLogsPage(page) {
        this.currentPage = page;
        await this.loadActivityLogs();
        this.renderActivityLogsTable();
    }

    renderSystemHealth() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="system-health-content">
                <div class="content-header">
                    <h1>Status systemu</h1>
                    <p>Monitoring stanu systemu i jego komponentów</p>
                </div>
                
                <div id="health-stats" class="dashboard-grid">
                    <!-- Health stats will be loaded here -->
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Szczegółowe informacje</h3>
                    </div>
                    <div class="card-body" id="health-details">
                        <p>Ładowanie danych o stanie systemu...</p>
                    </div>
                </div>
            </div>
        `;

        this.setupSystemHealthPage();
    }

    async setupSystemHealthPage() {
        const healthData = await this.loadSystemHealth();
        if (healthData) {
            this.renderSystemHealthData(healthData);
        }
    }

    renderSystemHealthData(health) {
        const statsContainer = document.getElementById('health-stats');
        const detailsContainer = document.getElementById('health-details');
        
        // Render health stats
        statsContainer.innerHTML = `
            <div class="stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">Status ogólny</h3>
                    <span class="stats-icon">${health.status === 'healthy' ? '✅' : '❌'}</span>
                </div>
                <div class="stats-value">${health.status === 'healthy' ? 'ZDROWY' : 'PROBLEMY'}</div>
                <p class="stats-description">Stan ogólny systemu</p>
            </div>
            
            <div class="stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">Baza danych</h3>
                    <span class="stats-icon">${health.database_status === 'healthy' ? '✅' : '❌'}</span>
                </div>
                <div class="stats-value">${health.database_status === 'healthy' ? 'OK' : 'BŁĄD'}</div>
                <p class="stats-description">Połączenie z bazą danych</p>
            </div>
            
            <div class="stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">Email</h3>
                    <span class="stats-icon">${health.email_status === 'healthy' ? '✅' : '❌'}</span>
                </div>
                <div class="stats-value">${health.email_status === 'healthy' ? 'OK' : 'BŁĄD'}</div>
                <p class="stats-description">Serwis email</p>
            </div>
            
            <div class="stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">Uptime</h3>
                    <span class="stats-icon">⏱️</span>
                </div>
                <div class="stats-value">${Math.floor(health.uptime / 3600)}h</div>
                <p class="stats-description">Czas działania serwera</p>
            </div>
        `;
        
        // Render health details
        detailsContainer.innerHTML = `
            <div class="health-details">
                <div class="detail-row">
                    <strong>Środowisko:</strong> ${health.environment}
                </div>
                <div class="detail-row">
                    <strong>Wersja Node.js:</strong> ${health.node_version}
                </div>
                <div class="detail-row">
                    <strong>Użycie pamięci:</strong> ${Math.round(health.memory_usage.used / 1024 / 1024)} MB
                </div>
                <div class="detail-row">
                    <strong>Ostatnia aktualizacja:</strong> ${UIUtils.formatDateTime(health.timestamp)}
                </div>
            </div>
        `;
    }
}

// Create global instance
const adminDashboard = new AdminDashboard();

// Navigation functions
function showUsers() {
    UIUtils.setActiveNavLink('users');
    adminDashboard.renderUsers();
}

function showSystemSettings() {
    UIUtils.setActiveNavLink('settings');
    adminDashboard.renderSystemSettings();
}

function showActivityLogs() {
    UIUtils.setActiveNavLink('logs');
    adminDashboard.renderActivityLogs();
}

function showSystemHealth() {
    UIUtils.setActiveNavLink('health');
    adminDashboard.renderSystemHealth();
}

// User modal functions
function showNewUserModal() {
    document.getElementById('user-modal-title').textContent = 'Dodaj użytkownika';
    document.getElementById('save-user-btn').textContent = 'Dodaj użytkownika';
    FormUtils.clearForm(document.getElementById('user-form'));
    document.getElementById('user-password').style.display = 'block';
    adminDashboard.setEditingUserId(null);
    document.getElementById('user-modal').style.display = 'flex';
}

function editUser(userId) {
    const user = adminDashboard.users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('user-modal-title').textContent = 'Edytuj użytkownika';
    document.getElementById('save-user-btn').textContent = 'Zaktualizuj';
    
    // Fill form
    document.getElementById('user-login').value = user.login;
    document.getElementById('user-password').style.display = 'none'; // Hide password field for edit
    document.getElementById('user-full-name').value = user.full_name;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role;
    document.getElementById('user-is-active').checked = user.is_active;
    
    adminDashboard.setEditingUserId(userId);
    document.getElementById('user-modal').style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('user-modal').style.display = 'none';
    FormUtils.clearForm(document.getElementById('user-form'));
    document.getElementById('user-password').style.display = 'block';
    adminDashboard.setEditingUserId(null);
}

async function deleteUserById(userId) {
    const result = await adminDashboard.deleteUser(userId);
    if (result.success) {
        await adminDashboard.loadUsers();
        adminDashboard.renderUsersTable();
    }
}

async function resetUserPassword(userId) {
    const newPassword = prompt('Wprowadź nowe hasło dla użytkownika:');
    if (newPassword && newPassword.length >= 6) {
        const result = await adminDashboard.resetUserPassword(userId, newPassword);
        if (result.success) {
            // Password reset successful
        }
    } else if (newPassword) {
        UIUtils.showError('Hasło musi mieć co najmniej 6 znaków');
    }
}

async function testEmailConnection() {
    try {
        UIUtils.showLoading();
        const response = await ApiClient.post('/admin/test-email');
        
        if (response.success) {
            UIUtils.showSuccess('Połączenie z serwerem email działa poprawnie');
        } else {
            UIUtils.showError('Błąd połączenia z serwerem email');
        }
    } catch (error) {
        console.error('Email test error:', error);
        UIUtils.showError('Błąd podczas testowania połączenia');
    } finally {
        UIUtils.hideLoading();
    }
}