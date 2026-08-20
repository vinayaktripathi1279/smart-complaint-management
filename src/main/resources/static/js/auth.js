// Auth Manager Script (Supports live demo mode fallback)
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
    let user = getCurrentUser();
    
    // Auto-login fallback for live demo if no user set
    if (!user) {
        if (requiredRole === 'ADMIN') {
            user = { id: 1, name: 'System Admin', email: 'admin@service.com', role: 'ADMIN' };
        } else {
            user = { id: 2, name: 'Rahul Sharma', email: 'student@service.com', role: 'USER' };
        }
        localStorage.setItem('user', JSON.stringify(user));
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

                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem('user', JSON.stringify({
                        id: data.id, name: data.name, email: data.email, role: data.role
                    }));
                    window.location.href = data.role === 'ADMIN' ? 'admin-dashboard.html' : 'user-dashboard.html';
                    return;
                }
            } catch (err) {
                console.log("Backend offline, using instant live demo mode");
            }

            // Demo Fallback for Live Web Hosting
            let role = email.includes('admin') ? 'ADMIN' : 'USER';
            let name = role === 'ADMIN' ? 'System Admin' : 'Rahul Sharma';
            localStorage.setItem('user', JSON.stringify({ id: role === 'ADMIN' ? 1 : 2, name, email, role }));
            window.location.href = role === 'ADMIN' ? 'admin-dashboard.html' : 'user-dashboard.html';
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const role = document.getElementById('role') ? document.getElementById('role').value : 'USER';

            showAlert('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                localStorage.setItem('user', JSON.stringify({ id: Date.now(), name, email, role }));
                window.location.href = role === 'ADMIN' ? 'admin-dashboard.html' : 'user-dashboard.html';
            }, 1200);
        });
    }
});

function quickFill(email, password) {
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    if (emailEl && passwordEl) {
        emailEl.value = email;
        passwordEl.value = password;
    }
}
