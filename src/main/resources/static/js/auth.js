// Auth Manager Script
const API_BASE = '/api/auth';

function showAlert(message, type = 'danger') {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) return;
    alertBox.className = `alert alert-${type}`;
    alertBox.innerText = message;
    alertBox.style.display = 'block';
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function checkAuth(requiredRole = null) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    if (requiredRole && user.role !== requiredRole) {
        if (user.role === 'ADMIN') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
        return null;
    }
    return user;
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function updateNavUser() {
    const user = getCurrentUser();
    const navUserEl = document.getElementById('navUser');
    if (navUserEl && user) {
        navUserEl.innerHTML = `
            Welcome, <strong>${user.name}</strong> 
            <span class="user-role-badge">${user.role}</span>
        `;
    }
}

// Attach Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    updateNavUser();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Login failed');
                }

                localStorage.setItem('user', JSON.stringify({
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    role: data.role
                }));

                if (data.role === 'ADMIN') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'user-dashboard.html';
                }
            } catch (err) {
                showAlert(err.message, 'danger');
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const role = document.getElementById('role') ? document.getElementById('role').value : 'USER';

            try {
                const res = await fetch(`${API_BASE}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Registration failed');
                }

                showAlert('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } catch (err) {
                showAlert(err.message, 'danger');
            }
        });
    }
});

// Quick Demo Helper
function quickFill(email, password) {
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    if (emailEl && passwordEl) {
        emailEl.value = email;
        passwordEl.value = password;
    }
}
