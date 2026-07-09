/**
 * ============================================
 * Auth.js — Autentikasi
 * ============================================
 */

const Auth = (() => {
    
    // Validasi email
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    
    // Validasi password
    const isValidPassword = (password) => {
        return password.length >= 8;
    };
    
    // Validasi username
    const isValidUsername = (username) => {
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    };
    
    // Hitung kekuatan password
    const getPasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 2) return { level: 'weak', label: 'Lemah' };
        if (score <= 3) return { level: 'medium', label: 'Sedang' };
        return { level: 'strong', label: 'Kuat' };
    };
    
    // Login
    const login = (email, password, remember = false) => {
        if (!isValidEmail(email)) {
            return { success: false, error: 'Email tidak valid' };
        }
        
        const user = Storage.getUserByEmail(email);
        if (!user) {
            return { success: false, error: 'Email tidak terdaftar' };
        }
        
        if (user.password !== password) {
            return { success: false, error: 'Password salah' };
        }
        
        Storage.setCurrentUser(user.id);
        if (remember) {
            localStorage.setItem('redditx_remember', 'true');
        }
        
        return { success: true, user };
    };
    
    // Signup
    const signup = (username, email, password) => {
        if (!isValidUsername(username)) {
            return { success: false, error: 'Username harus 3-20 karakter (huruf, angka, underscore)' };
        }
        
        if (Storage.getUserByUsername(username)) {
            return { success: false, error: 'Username sudah digunakan' };
        }
        
        if (!isValidEmail(email)) {
            return { success: false, error: 'Email tidak valid' };
        }
        
        if (Storage.getUserByEmail(email)) {
            return { success: false, error: 'Email sudah terdaftar' };
        }
        
        if (!isValidPassword(password)) {
            return { success: false, error: 'Password minimal 8 karakter' };
        }
        
        const user = Storage.createUser({ username, email, password });
        Storage.setCurrentUser(user.id);
        
        return { success: true, user };
    };
    
    // Logout
    const logout = () => {
        Storage.setCurrentUser(null);
        localStorage.removeItem('redditx_remember');
    };
    
    // Init form handlers
    const init = () => {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value;
                const remember = document.getElementById('remember-me').checked;
                
                const result = login(email, password, remember);
                if (result.success) {
                    UI.toast('Login berhasil! Selamat datang kembali', 'success');
                    setTimeout(() => window.location.href = 'index.html', 800);
                } else {
                    UI.toast(result.error, 'error');
                }
            });
        }
        
        // Signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            const passwordInput = document.getElementById('signup-password');
            const strengthBar = document.querySelector('.strength-bar');
            
            if (passwordInput && strengthBar) {
                passwordInput.addEventListener('input', (e) => {
                    const strength = getPasswordStrength(e.target.value);
                    strengthBar.className = 'strength-bar ' + strength.level;
                });
            }
            
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('signup-username').value.trim();
                const email = document.getElementById('signup-email').value.trim();
                const password = document.getElementById('signup-password').value;
                const confirm = document.getElementById('signup-confirm').value;
                const agree = document.getElementById('agree-terms').checked;
                
                if (!agree) {
                    UI.toast('Anda harus menyetujui syarat & ketentuan', 'warning');
                    return;
                }
                
                if (password !== confirm) {
                    UI.toast('Password tidak cocok', 'error');
                    return;
                }
                
                const result = signup(username, email, password);
                if (result.success) {
                    UI.toast('Akun berhasil dibuat! Selamat bergabung', 'success');
                    setTimeout(() => window.location.href = 'index.html', 800);
                } else {
                    UI.toast(result.error, 'error');
                }
            });
        }
        
        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
                const icon = btn.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            });
        });
        
        // Forgot password link
        const forgotLink = document.getElementById('forgot-link');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                const email = prompt('Masukkan email Anda:');
                if (email) {
                    UI.toast('Link reset password telah dikirim ke email Anda (simulasi)', 'info');
                }
            });
        }
    };
    
    return { init, login, logout, signup, isValidEmail, isValidPassword, isValidUsername, getPasswordStrength };
})();