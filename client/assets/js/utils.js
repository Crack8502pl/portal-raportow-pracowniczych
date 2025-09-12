// Utility functions for the Portal Raportów Pracowniczych

// API Base URL
const API_BASE = '/api';

// Local storage keys
const STORAGE_KEYS = {
    TOKEN: 'portal_access_token',
    REFRESH_TOKEN: 'portal_refresh_token',
    USER: 'portal_user_data'
};

// API Helper
class ApiClient {
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            
            // Handle token refresh if needed
            if (response.status === 401 && token) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    config.headers['Authorization'] = `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`;
                    return await fetch(`${API_BASE}${endpoint}`, config);
                } else {
                    AuthManager.logout();
                    return response;
                }
            }

            return response;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    static async get(endpoint, params = {}) {
        const url = new URL(endpoint, window.location.origin + API_BASE);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });
        
        const response = await this.request(url.pathname + url.search);
        return await response.json();
    }

    static async post(endpoint, data = {}) {
        const response = await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    static async put(endpoint, data = {}) {
        const response = await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    static async delete(endpoint) {
        const response = await this.request(endpoint, {
            method: 'DELETE'
        });
        return await response.json();
    }

    static async upload(endpoint, formData) {
        const response = await this.request(endpoint, {
            method: 'POST',
            headers: {}, // Let browser set content-type for FormData
            body: formData
        });
        return await response.json();
    }

    static async refreshToken() {
        try {
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
                return false;
            }

            const response = await fetch(`${API_BASE}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem(STORAGE_KEYS.TOKEN, data.data.tokens.accessToken);
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.data.tokens.refreshToken);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }
}

// Authentication Manager
class AuthManager {
    static setTokens(tokens) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, tokens.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    }

    static setUser(user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    static getUser() {
        const userData = localStorage.getItem(STORAGE_KEYS.USER);
        return userData ? JSON.parse(userData) : null;
    }

    static isAuthenticated() {
        return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
    }

    static logout() {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.reload();
    }

    static hasRole(role) {
        const user = this.getUser();
        return user && user.role === role;
    }

    static hasAnyRole(roles) {
        const user = this.getUser();
        return user && roles.includes(user.role);
    }
}

// UI Utilities
class UIUtils {
    static showLoading() {
        document.getElementById('loading-spinner').style.display = 'flex';
    }

    static hideLoading() {
        document.getElementById('loading-spinner').style.display = 'none';
    }

    static showToast(message, type = 'success', duration = 5000) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        // Remove existing classes
        toast.classList.remove('show', 'error', 'warning', 'success');
        
        // Add new classes
        toast.classList.add('show', type);
        toastMessage.textContent = message;
        
        // Auto hide after duration
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    static showError(message) {
        this.showToast(message, 'error');
    }

    static showWarning(message) {
        this.showToast(message, 'warning');
    }

    static showSuccess(message) {
        this.showToast(message, 'success');
    }

    static setActiveNavLink(viewName) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current view
        const activeLink = document.querySelector(`[data-view="${viewName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('pl-PL');
    }

    static formatDateTime(date) {
        return new Date(date).toLocaleString('pl-PL');
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static confirmDialog(message) {
        return confirm(message);
    }

    static sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Form Utilities
class FormUtils {
    static collectFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                // Convert to array if multiple values
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }

    static clearForm(form) {
        form.reset();
        // Clear error messages
        form.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        // Remove validation classes
        form.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('has-error', 'has-success');
        });
    }

    static showFieldError(fieldName, message) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            const formGroup = field.closest('.form-group');
            if (formGroup) {
                formGroup.classList.add('has-error');
                const errorElement = formGroup.querySelector('.error-message');
                if (errorElement) {
                    errorElement.textContent = message;
                }
            }
        }
    }

    static clearFieldErrors(form) {
        form.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('has-error', 'has-success');
        });
        form.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
    }

    static validateRequired(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field.name, 'To pole jest wymagane');
                isValid = false;
            }
        });
        
        return isValid;
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateTime(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    static setupCharCounter(textarea, maxLength) {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.innerHTML = `<span class="char-count">0</span>/<span class="char-max">${maxLength}</span>`;
        
        textarea.parentNode.appendChild(counter);
        
        const updateCounter = () => {
            const length = textarea.value.length;
            const countSpan = counter.querySelector('.char-count');
            countSpan.textContent = length;
            
            // Add warning/error classes
            countSpan.classList.remove('warning', 'error');
            if (length > maxLength * 0.9) {
                countSpan.classList.add('warning');
            }
            if (length > maxLength) {
                countSpan.classList.add('error');
            }
        };
        
        textarea.addEventListener('input', updateCounter);
        updateCounter();
    }
}

// Table Utilities
class TableUtils {
    static createTable(data, columns, options = {}) {
        const table = document.createElement('table');
        table.className = 'table';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.title;
            if (col.sortable) {
                th.style.cursor = 'pointer';
                th.addEventListener('click', () => {
                    if (options.onSort) {
                        options.onSort(col.key);
                    }
                });
            }
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            
            columns.forEach(col => {
                const td = document.createElement('td');
                
                if (col.render) {
                    td.innerHTML = col.render(row[col.key], row);
                } else {
                    td.textContent = row[col.key] || '';
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        return table;
    }

    static createPagination(currentPage, totalPages, onPageChange) {
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Poprzednia';
        prevBtn.disabled = currentPage <= 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) onPageChange(currentPage - 1);
        });
        pagination.appendChild(prevBtn);
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.classList.toggle('active', i === currentPage);
            btn.addEventListener('click', () => onPageChange(i));
            pagination.appendChild(btn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Następna →';
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) onPageChange(currentPage + 1);
        });
        pagination.appendChild(nextBtn);
        
        return pagination;
    }
}

// File Upload Utilities
class FileUploadUtils {
    static setupDragAndDrop(element, callback) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('dragover');
        });
        
        element.addEventListener('dragleave', () => {
            element.classList.remove('dragover');
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            callback(files);
        });
    }

    static validateFiles(files, allowedTypes, maxSize) {
        const errors = [];
        
        files.forEach((file, index) => {
            // Check file type
            const extension = file.name.split('.').pop().toLowerCase();
            if (!allowedTypes.includes(extension)) {
                errors.push(`Plik ${file.name}: Niedozwolony typ pliku`);
                return;
            }
            
            // Check file size
            if (file.size > maxSize) {
                errors.push(`Plik ${file.name}: Zbyt duży rozmiar (max ${UIUtils.formatFileSize(maxSize)})`);
            }
        });
        
        return errors;
    }

    static createFilePreview(file) {
        const preview = document.createElement('div');
        preview.className = 'file-item';
        
        const info = document.createElement('div');
        info.className = 'file-info';
        
        const icon = document.createElement('span');
        icon.className = 'file-icon';
        icon.textContent = this.getFileIcon(file.name);
        
        const details = document.createElement('div');
        details.className = 'file-details';
        
        const name = document.createElement('div');
        name.className = 'file-name';
        name.textContent = file.name;
        
        const size = document.createElement('div');
        size.className = 'file-size';
        size.textContent = UIUtils.formatFileSize(file.size);
        
        details.appendChild(name);
        details.appendChild(size);
        
        info.appendChild(icon);
        info.appendChild(details);
        
        const actions = document.createElement('div');
        actions.className = 'file-actions';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-remove';
        removeBtn.textContent = '×';
        removeBtn.type = 'button';
        
        actions.appendChild(removeBtn);
        
        preview.appendChild(info);
        preview.appendChild(actions);
        
        return preview;
    }

    static getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const iconMap = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            xls: '📊',
            xlsx: '📊',
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️',
            gif: '🖼️'
        };
        
        return iconMap[extension] || '📎';
    }
}

// Password toggle function
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('password-toggle-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = '👁️';
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    UIUtils.showError('Wystąpił nieoczekiwany błąd');
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    UIUtils.showError('Wystąpił błąd podczas wykonywania operacji');
    event.preventDefault();
});