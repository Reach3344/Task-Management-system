const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
})

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
})


document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.querySelector('.login-btn');
    const registerForm = document.getElementById('register-form');
    const registerBtn = document.querySelector('.register-btn');


    if (!localStorage.getItem('taskManagerUsers')) {
        localStorage.setItem('taskManagerUsers', JSON.stringify([
            {
                id: 1,
                username: 'admin',
                email: 'admin@gmail.com',
                password: 'admin123',
                createdAt: new Date().toISOString(),
                loginCount: 0
            }
        ]));
    }

    // Alert 
    function showAlert(type, message) {
        const successAlert = document.getElementById('successAlert');
        const errorAlert = document.getElementById('errorAlert');
        successAlert.classList.add('d-none');
        errorAlert.classList.add('d-none');

        if (type === 'success' || type === 'info') {
            successAlert.textContent = message;
            successAlert.classList.remove('d-none');
        } else {
            errorAlert.textContent = message;
            errorAlert.classList.remove('d-none');
        }
    }
    // login 
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = this.querySelector('input[type="text"]').value.trim();
        const password = this.querySelector('input[type="password"]').value;

        const users = JSON.parse(localStorage.getItem('taskManagerUsers'));
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            user.loginCount = (user.loginCount || 0) + 1;
            user.lastLogin = new Date().toISOString();
            localStorage.setItem('taskManagerUsers', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(user));

            showAlert('success', 'Login successful! Redirecting...');
            setTimeout(() => window.location.href = '../pages/homePage.html', 500);
        } else {
            showAlert('error', 'Invalid username or password. Try: admin / admin123');
        }
    });

    // Register
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = this.querySelector('input[type="text"]').value.trim();
        const email = this.querySelector('input[type="email"]').value.trim();
        const password = this.querySelector('input[type="password"]').value;

        const users = JSON.parse(localStorage.getItem('taskManagerUsers'));

        if (users.some(u => u.username === username)) { showAlert('error', 'Username already exists'); return; }
        if (users.some(u => u.email === email)) { showAlert('error', 'Email already registered'); return; }

        const newUser = { id: Date.now(), username, email, password, createdAt: new Date().toISOString(), loginCount: 1 };
        users.push(newUser);
        localStorage.setItem('taskManagerUsers', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));

        showAlert('success', 'Registration successful! Redirecting...');
        setTimeout(() => window.location.href = '../pages/homePage.html', 500);
    });

});