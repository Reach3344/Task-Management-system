const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn?.addEventListener('click', () => {
    container.classList.add('active');
})

loginBtn?.addEventListener('click', () => {
    container.classList.remove('active');
})


document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usersStorageKey = 'taskManagerUsers';

    if (!container || !loginForm || !registerForm) return;

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
        try {
            const users = JSON.parse(localStorage.getItem(usersStorageKey) || '[]');
            return Array.isArray(users) ? users : [];
        } catch (error) {
            return [];
        }
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
        const loginId = this.elements.loginId.value.trim().toLowerCase();
        const password = this.elements.loginPassword.value;
        const submitButton = this.querySelector('button[type="submit"]');
        let shouldRedirect = false;

        setButtonState(submitButton, true, 'Login');

        try {
            const users = getStoredUsers();
            const matchedUser = users.find((user) => {
                const username = (user.username || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                return (username === loginId || email === loginId) && user.password === password;
            });

            if (!matchedUser) {
                throw new Error('Invalid username, email, or password.');
            }

            saveCurrentUser(matchedUser);
            shouldRedirect = true;
            showAlert('success', 'Login successful! Redirecting...');
            setTimeout(() => window.location.href = 'pages/homePage.html', 500);
        } catch (error) {
            showAlert('error', error.message || 'Invalid username, email, or password.');
            setButtonState(submitButton, false, 'Login');
        } finally {
            if (!shouldRedirect) {
                setButtonState(submitButton, false, 'Login');
            }
        }
    });

    // Register
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const username = this.elements.username.value.trim();
        const email = this.elements.email.value.trim();
        const password = this.elements.password.value;
        const confirmPassword = this.elements.confirmPassword.value;
        const submitButton = this.querySelector('button[type="submit"]');
        let shouldRedirect = false;

        if (!username || !email || !password || !confirmPassword) {
            showAlert('error', 'All registration fields are required.');
            return;
        }

        if (!emailPattern.test(email)) {
            showAlert('error', 'Please enter a valid email address.');
            return;
        }

        if (password.length < 8) {
            showAlert('error', 'Password must be at least 8 characters.');
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
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Date.now().toString(),
                username,
                email,
                password,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            saveStoredUsers(users);
            saveCurrentUser(newUser);
            shouldRedirect = true;
            showAlert('success', 'Registration successful! Redirecting...');
            setTimeout(() => window.location.href = 'pages/homePage.html', 500);
        } catch (error) {
            showAlert('error', error.message || 'Registration failed.');
            setButtonState(submitButton, false, 'Register');
        } finally {
            if (!shouldRedirect) {
                setButtonState(submitButton, false, 'Register');
            }
        }
    });

});
