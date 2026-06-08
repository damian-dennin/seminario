// Archivo: static/scripts/auth.js

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPasswordValidation();
        this.setupFormValidation();
        this.hideNotification();
    }

    setupEventListeners() {
        // Event listeners para los formularios
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Event listeners para validación en tiempo real
        const registerPassword = document.getElementById('registerPassword');
        const confirmPassword = document.getElementById('confirmPassword');

        if (registerPassword) {
            registerPassword.addEventListener('input', () => this.validatePassword());
        }

        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
        }

        // Event listeners para validación de email y username
        const registerEmail = document.getElementById('registerEmail');
        const username = document.getElementById('username');

        if (registerEmail) {
            registerEmail.addEventListener('blur', () => this.validateEmail());
        }

        if (username) {
            username.addEventListener('blur', () => this.validateUsername());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Validar campos
        if (!email || !password) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('¡Inicio de sesión exitoso!', 'success');
                
                // Guardar datos del usuario en sessionStorage
                sessionStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.removeItem('stackr_viewedProjects');
                
                // Redirigir al feed después de un breve delay
                setTimeout(() => {
                    window.location.href = '/feed';
                }, 1500);
            } else {
                this.showNotification(data.error || 'Error al iniciar sesión', 'error');
                this.clearLoginErrors();
                
                if (data.error.includes('Email') || data.error.includes('contraseña')) {
                    document.getElementById('loginEmailError').textContent = 'Email o contraseña incorrectos';
                    document.getElementById('loginPasswordError').textContent = 'Email o contraseña incorrectos';
                }
            }
        } catch (error) {
            this.showNotification('Error de conexión. Intenta nuevamente.', 'error');
            console.error('Error en login:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        // Validar formulario
        if (!this.validateRegisterForm()) {
            return;
        }

        const formData = new FormData(e.target);
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            username: formData.get('username'),
            password: formData.get('password'),
            skills: formData.get('skills')
        };

        this.showLoading(true);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('¡Cuenta creada exitosamente!', 'success');
                
                // Guardar datos del usuario en sessionStorage
                sessionStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.removeItem('stackr_viewedProjects');
                
                // Redirigir al feed después de un breve delay
                setTimeout(() => {
                    window.location.href = '/feed';
                }, 1500);
            } else {
                this.showNotification(data.error || 'Error al crear la cuenta', 'error');
                this.handleRegisterErrors(data.error);
            }
        } catch (error) {
            this.showNotification('Error de conexión. Intenta nuevamente.', 'error');
            console.error('Error en registro:', error);
        } finally {
            this.showLoading(false);
        }
    }

    validateRegisterForm() {
        let isValid = true;
        this.clearRegisterErrors();

        // Validar nombre
        const firstName = document.getElementById('firstName').value.trim();
        if (!firstName) {
            document.getElementById('firstNameError').textContent = 'El nombre es requerido';
            isValid = false;
        }

        // Validar apellido
        const lastName = document.getElementById('lastName').value.trim();
        if (!lastName) {
            document.getElementById('lastNameError').textContent = 'El apellido es requerido';
            isValid = false;
        }

        // Validar email
        const email = document.getElementById('registerEmail').value.trim();
        if (!email) {
            document.getElementById('registerEmailError').textContent = 'El email es requerido';
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            document.getElementById('registerEmailError').textContent = 'El email no es válido';
            isValid = false;
        }

        // Validar username
        const username = document.getElementById('username').value.trim();
        if (!username) {
            document.getElementById('usernameError').textContent = 'El nombre de usuario es requerido';
            isValid = false;
        } else if (username.length < 3) {
            document.getElementById('usernameError').textContent = 'El nombre de usuario debe tener al menos 3 caracteres';
            isValid = false;
        }

        // Validar contraseña
        const password = document.getElementById('registerPassword').value;
        if (!password) {
            document.getElementById('registerPasswordError').textContent = 'La contraseña es requerida';
            isValid = false;
        } else if (password.length < 6) {
            document.getElementById('registerPasswordError').textContent = 'La contraseña debe tener al menos 6 caracteres';
            this.showNotification('La contraseña debe tener al menos 6 caracteres.', 'error');
            isValid = false;
        }

        // Validar confirmación de contraseña
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (!confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Confirma tu contraseña';
            isValid = false;
        } else if (password !== confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Las contraseñas no coinciden';
            this.showNotification('Las contraseñas ingresadas no coinciden.', 'error');
            isValid = false;
        }

        // Validar términos y condiciones
        const acceptTerms = document.getElementById('acceptTerms').checked;
        if (!acceptTerms) {
            this.showNotification('Debes aceptar los términos y condiciones', 'error');
            isValid = false;
        }

        return isValid;
    }

    validatePassword() {
        const password = document.getElementById('registerPassword').value;
        const strengthIndicator = document.getElementById('passwordStrength');
        
        if (!strengthIndicator) return;

        let strength = 0;
        let strengthText = '';
        let strengthClass = '';

        if (password.length >= 6) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;

        switch (strength) {
            case 0:
            case 1:
                strengthText = 'Muy débil';
                strengthClass = 'very-weak';
                break;
            case 2:
                strengthText = 'Débil';
                strengthClass = 'weak';
                break;
            case 3:
                strengthText = 'Regular';
                strengthClass = 'regular';
                break;
            case 4:
                strengthText = 'Fuerte';
                strengthClass = 'strong';
                break;
            case 5:
                strengthText = 'Muy fuerte';
                strengthClass = 'very-strong';
                break;
        }

        strengthIndicator.innerHTML = `
            <div class="password-strength-bar ${strengthClass}">
                <div class="strength-fill"></div>
            </div>
            <span class="strength-text">${strengthText}</span>
        `;
    }

    validatePasswordMatch() {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorElement = document.getElementById('confirmPasswordError');

        if (confirmPassword && password !== confirmPassword) {
            errorElement.textContent = 'Las contraseñas no coinciden';
        } else {
            errorElement.textContent = '';
        }
    }

    validateEmail() {
        const email = document.getElementById('registerEmail').value.trim();
        const errorElement = document.getElementById('registerEmailError');

        if (email && !this.isValidEmail(email)) {
            errorElement.textContent = 'El formato del email no es válido';
        } else {
            errorElement.textContent = '';
        }
    }

    validateUsername() {
        const username = document.getElementById('username').value.trim();
        const errorElement = document.getElementById('usernameError');

        if (username && username.length < 3) {
            errorElement.textContent = 'El nombre de usuario debe tener al menos 3 caracteres';
        } else if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
            errorElement.textContent = 'Solo se permiten letras, números y guiones bajos';
        } else {
            errorElement.textContent = '';
        }
    }

    setupPasswordValidation() {
        // Configuración adicional para validación de contraseñas
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.id === 'registerPassword') {
                    this.validatePassword();
                }
                if (input.id === 'confirmPassword') {
                    this.validatePasswordMatch();
                }
            });
        });
    }

    setupFormValidation() {
        // Configuración adicional para validación de formularios
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });
            
            input.addEventListener('input', () => {
                this.clearInputError(input);
            });
        });
    }

    validateInput(input) {
        const value = input.value.trim();
        const errorElement = document.getElementById(input.id + 'Error');
        
        if (!errorElement) return;

        if (input.hasAttribute('required') && !value) {
            errorElement.textContent = 'Este campo es requerido';
        } else if (input.type === 'email' && value && !this.isValidEmail(value)) {
            errorElement.textContent = 'El formato del email no es válido';
        } else {
            errorElement.textContent = '';
        }
    }

    clearInputError(input) {
        const errorElement = document.getElementById(input.id + 'Error');
        if (errorElement && input.value.trim()) {
            errorElement.textContent = '';
        }
    }

    handleRegisterErrors(error) {
        // Limpiar errores anteriores
        this.clearRegisterErrors();

        // Mostrar errores específicos según el mensaje
        if (error.includes('email') && error.includes('registrado')) {
            document.getElementById('registerEmailError').textContent = 'Este email ya está registrado';
        } else if (error.includes('usuario') && error.includes('uso')) {
            document.getElementById('usernameError').textContent = 'Este nombre de usuario ya está en uso';
        }
    }

    clearLoginErrors() {
        const loginErrors = ['loginEmailError', 'loginPasswordError'];
        loginErrors.forEach(errorId => {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.textContent = '';
            }
        });
    }

    clearRegisterErrors() {
        const registerErrors = [
            'firstNameError', 'lastNameError', 'registerEmailError', 
            'usernameError', 'registerPasswordError', 'confirmPasswordError'
        ];
        registerErrors.forEach(errorId => {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.textContent = '';
            }
        });
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageElement = notification.querySelector('.notification-message');
        const iconElement = notification.querySelector('.notification-icon');

        messageElement.textContent = message;
        
        // Configurar icono según el tipo
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        iconElement.textContent = icons[type] || icons.info;
        
        // Aplicar clase de tipo
        notification.className = `notification ${type}`;
        
        // Mostrar notificación
        notification.style.display = 'flex';
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }
}

// Funciones globales para el HTML
function showLogin() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    }
}

function showRegister() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleIcon = input.parentElement.querySelector('.password-toggle-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggleIcon.textContent = '🙈';
    } else {
        input.type = 'password';
        toggleIcon.textContent = '👁️';
    }
}

function hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.style.display = 'none';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// Exportar para uso en otros archivos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

document.addEventListener('DOMContentLoaded', () => {
    const revealElements = document.querySelectorAll('.feature-card, .testimonial-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.transition = 'all 0.6s ease';
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
});
