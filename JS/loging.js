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
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    const usersStorageKey = 'taskManagerUsers';

    // Alert 
    function showAlert(type, message) {
        const activeForm = container.classList.contains('active') ? registerForm : loginForm;
        let alertBox = activeForm.querySelector('.form-alert');

        if (!alertBox) {
            alertBox = document.createElement('div');
            alertBox.className = 'form-alert';
            activeForm.insertBefore(alertBox, activeForm.querySelector('.input-box'));
        }

        alertBox.textContent = message;
        alertBox.className = `form-alert alert ${type === 'success' || type === 'info' ? 'alert-success' : 'alert-danger'}`;
    }

    function getStoredUsers() {
        return JSON.parse(localStorage.getItem(usersStorageKey) || '[]');
    }

    function saveStoredUsers(users) {
        localStorage.setItem(usersStorageKey, JSON.stringify(users));
    }

    function saveCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email
        }));
    }

    function setButtonState(button, isLoading, defaultLabel) {
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Please wait...' : defaultLabel;
    }

    // login 
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const username = this.querySelector('input[type="text"]').value.trim();
        const password = this.querySelector('input[type="password"]').value;

        setButtonState(this.querySelector('button[type="submit"]'), true, 'Login');

        try {
            const users = getStoredUsers();
            const matchedUser = users.find((user) => user.username === username && user.password === password);

            if (!matchedUser) {
                throw new Error('Invalid username or password.');
            }

            saveCurrentUser(matchedUser);
            showAlert('success', 'Login successful! Redirecting...');
            setTimeout(() => window.location.href = 'pages/homePage.html', 500);
        } catch (error) {
            showAlert('error', error.message || 'Invalid username or password.');
        } finally {
            setButtonState(this.querySelector('button[type="submit"]'), false, 'Login');
        }
    });

    // Register
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const username = this.querySelector('input[type="text"]').value.trim();
        const email = this.querySelector('input[type="email"]').value.trim();
        const passwordInputs = this.querySelectorAll('input[type="password"]');
        const password = passwordInputs[0].value;
        const confirmPassword = passwordInputs[1].value;
        const submitButton = this.querySelector('button[type="submit"]');

        if (!username || !email || !password || !confirmPassword) {
            showAlert('error', 'All registration fields are required.');
            return;
        }

        if (!emailPattern.test(email)) {
            showAlert('error', 'Please enter a valid email address.');
            return;
        }

        if (!strongPasswordPattern.test(password)) {
            showAlert('error', 'Password must be at least 8 characters and include uppercase, lowercase, and a number.');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('error', 'Password and confirm password do not match.');
            return;
        }

        setButtonState(submitButton, true, 'Register');

        try {
            const users = getStoredUsers();
            const usernameExists = users.some((user) => user.username.toLowerCase() === username.toLowerCase());
            const emailExists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());

            if (usernameExists) {
                throw new Error('Username is already taken.');
            }

            if (emailExists) {
                throw new Error('Email is already registered.');
            }

            const newUser = {
                id: Date.now(),
                username,
                email,
                password,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            saveStoredUsers(users);
            saveCurrentUser(newUser);
            showAlert('success', 'Registration successful! Redirecting...');
            setTimeout(() => window.location.href = 'pages/homePage.html', 500);
        } catch (error) {
            showAlert('error', error.message || 'Registration failed.');
        } finally {
            setButtonState(submitButton, false, 'Register');
        }
    });

});
