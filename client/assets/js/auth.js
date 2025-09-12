// Authentication handling for Portal Raportów Pracowniczych

class Auth {
    static async login(credentials) {
        try {
            UIUtils.showLoading();
            
            const response = await ApiClient.post('/auth/login', credentials);
            
            if (response.success) {
                AuthManager.setTokens(response.data.tokens);
                AuthManager.setUser(response.data.user);
                return { success: true, user: response.data.user };
            } else {
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    static async logout() {
        try {
            await ApiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            AuthManager.logout();
        }
    }

    static async getProfile() {
        try {
            const response = await ApiClient.get('/auth/profile');
            if (response.success) {
                AuthManager.setUser(response.data);
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Get profile error:', error);
            return null;
        }
    }

    static async updateProfile(profileData) {
        try {
            UIUtils.showLoading();
            const response = await ApiClient.put('/auth/profile', profileData);
            
            if (response.success) {
                AuthManager.setUser(response.data);
                UIUtils.showSuccess('Profil został zaktualizowany pomyślnie');
                return { success: true, user: response.data };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Update profile error:', error);
            UIUtils.showError('Błąd podczas aktualizacji profilu');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }

    static async changePassword(passwordData) {
        try {
            UIUtils.showLoading();
            const response = await ApiClient.post('/auth/change-password', passwordData);
            
            if (response.success) {
                UIUtils.showSuccess('Hasło zostało zmienione pomyślnie');
                return { success: true };
            } else {
                UIUtils.showError(response.message);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Change password error:', error);
            UIUtils.showError('Błąd podczas zmiany hasła');
            return { success: false, error: 'Błąd połączenia z serwerem' };
        } finally {
            UIUtils.hideLoading();
        }
    }
}

// Login form handler
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    const loginButton = loginForm.querySelector('button[type="submit"]');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        FormUtils.clearFieldErrors(loginForm);
        
        // Get form data
        const formData = FormUtils.collectFormData(loginForm);
        
        // Basic validation
        if (!formData.login || !formData.password) {
            if (!formData.login) FormUtils.showFieldError('login', 'Login jest wymagany');
            if (!formData.password) FormUtils.showFieldError('password', 'Hasło jest wymagane');
            return;
        }
        
        // Disable button and show loading
        loginButton.classList.add('loading');
        loginButton.disabled = true;
        
        try {
            const result = await Auth.login({
                login: formData.login.trim(),
                password: formData.password
            });
            
            if (result.success) {
                UIUtils.showSuccess('Zalogowano pomyślnie');
                // Initialize dashboard
                await initializeDashboard(result.user);
            } else {
                const errorMessage = document.getElementById('login-error-message');
                errorMessage.textContent = result.error;
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Login form error:', error);
            const errorMessage = document.getElementById('login-error-message');
            errorMessage.textContent = 'Wystąpił nieoczekiwany błąd';
            errorMessage.style.display = 'block';
        } finally {
            loginButton.classList.remove('loading');
            loginButton.disabled = false;
        }
    });
}

// Profile modal handlers
function showProfile() {
    const user = AuthManager.getUser();
    if (!user) return;
    
    const modal = document.getElementById('profile-modal');
    const form = document.getElementById('profile-form');
    
    // Populate form
    document.getElementById('profile-full-name').value = user.full_name || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-login').value = user.login || '';
    document.getElementById('profile-role').value = getRoleDisplayName(user.role);
    
    modal.style.display = 'flex';
}

function closeProfile() {
    const modal = document.getElementById('profile-modal');
    modal.style.display = 'none';
    
    // Clear password form
    const passwordForm = document.getElementById('password-change-form');
    FormUtils.clearForm(passwordForm);
}

function setupProfileForm() {
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-change-form');
    
    // Profile update form
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        FormUtils.clearFieldErrors(profileForm);
        
        const formData = FormUtils.collectFormData(profileForm);
        
        // Validate required fields
        if (!formData.full_name || !formData.email) {
            if (!formData.full_name) FormUtils.showFieldError('full_name', 'Imię i nazwisko jest wymagane');
            if (!formData.email) FormUtils.showFieldError('email', 'Email jest wymagany');
            return;
        }
        
        // Validate email format
        if (!FormUtils.validateEmail(formData.email)) {
            FormUtils.showFieldError('email', 'Nieprawidłowy format email');
            return;
        }
        
        const result = await Auth.updateProfile({
            full_name: formData.full_name.trim(),
            email: formData.email.trim()
        });
        
        if (result.success) {
            // Update displayed user info
            updateUserDisplay(result.user);
            closeProfile();
        }
    });
    
    // Password change form
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        FormUtils.clearFieldErrors(passwordForm);
        
        const formData = FormUtils.collectFormData(passwordForm);
        
        // Validate required fields
        if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
            if (!formData.current_password) FormUtils.showFieldError('current_password', 'Aktualne hasło jest wymagane');
            if (!formData.new_password) FormUtils.showFieldError('new_password', 'Nowe hasło jest wymagane');
            if (!formData.confirm_password) FormUtils.showFieldError('confirm_password', 'Potwierdzenie hasła jest wymagane');
            return;
        }
        
        // Check password length
        if (formData.new_password.length < 6) {
            FormUtils.showFieldError('new_password', 'Hasło musi mieć co najmniej 6 znaków');
            return;
        }
        
        // Check password confirmation
        if (formData.new_password !== formData.confirm_password) {
            FormUtils.showFieldError('confirm_password', 'Hasła nie są identyczne');
            return;
        }
        
        const result = await Auth.changePassword({
            current_password: formData.current_password,
            new_password: formData.new_password,
            confirm_password: formData.confirm_password
        });
        
        if (result.success) {
            FormUtils.clearForm(passwordForm);
        }
    });
}

// Dashboard initialization
async function initializeDashboard(user) {
    // Hide login page
    document.getElementById('login-page').style.display = 'none';
    
    // Show dashboard
    const dashboardPage = document.getElementById('dashboard-page');
    dashboardPage.style.display = 'block';
    
    // Update user display
    updateUserDisplay(user);
    
    // Setup role-based navigation
    setupNavigation(user.role);
    
    // Load initial dashboard content
    showDashboard();
    
    // Setup profile form
    setupProfileForm();
}

function updateUserDisplay(user) {
    document.getElementById('user-name').textContent = user.full_name;
    document.getElementById('user-role').textContent = getRoleDisplayName(user.role);
}

function setupNavigation(userRole) {
    // Show/hide navigation sections based on role
    const coordinatorSection = document.getElementById('coordinator-section');
    const adminSection = document.getElementById('admin-section');
    
    if (userRole === 'coordinator' || userRole === 'admin') {
        coordinatorSection.style.display = 'block';
    }
    
    if (userRole === 'admin') {
        adminSection.style.display = 'block';
    }
}

function getRoleDisplayName(role) {
    const roleNames = {
        'employee': 'Pracownik',
        'coordinator': 'Koordynator',
        'admin': 'Administrator'
    };
    return roleNames[role] || role;
}

// Logout function
async function logout() {
    if (UIUtils.confirmDialog('Czy na pewno chcesz się wylogować?')) {
        await Auth.logout();
    }
}

// Main initialization function
async function initializeApp() {
    UIUtils.showLoading();
    
    try {
        // Check if user is already authenticated
        if (AuthManager.isAuthenticated()) {
            // Try to get user profile
            const user = await Auth.getProfile();
            
            if (user) {
                // User is authenticated, show dashboard
                await initializeDashboard(user);
            } else {
                // Token invalid, show login
                showLogin();
            }
        } else {
            // Not authenticated, show login
            showLogin();
        }
    } catch (error) {
        console.error('App initialization error:', error);
        showLogin();
    } finally {
        UIUtils.hideLoading();
    }
}

function showLogin() {
    document.getElementById('login-page').style.display = 'block';
    document.getElementById('dashboard-page').style.display = 'none';
    setupLoginForm();
}

// Modal click outside to close
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'profile-modal') {
            closeProfile();
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to close modals
    if (e.key === 'Escape') {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal.style.display === 'flex') {
            closeProfile();
        }
    }
    
    // Ctrl+L to focus login field (when on login page)
    if (e.ctrlKey && e.key === 'l') {
        const loginInput = document.getElementById('login');
        if (loginInput && loginInput.offsetParent !== null) {
            e.preventDefault();
            loginInput.focus();
        }
    }
});

// Auto-logout on token expiry
setInterval(async () => {
    if (AuthManager.isAuthenticated()) {
        try {
            const response = await ApiClient.get('/auth/verify-token');
            if (!response.success) {
                UIUtils.showWarning('Sesja wygasła. Zostaniesz wylogowany.');
                setTimeout(() => {
                    AuthManager.logout();
                }, 3000);
            }
        } catch (error) {
            console.error('Token verification error:', error);
        }
    }
}, 300000); // Check every 5 minutes

// Handle online/offline status
window.addEventListener('online', () => {
    UIUtils.showSuccess('Połączenie zostało przywrócone');
});

window.addEventListener('offline', () => {
    UIUtils.showWarning('Brak połączenia z internetem');
});