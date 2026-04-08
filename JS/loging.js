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

    async function sendAuthRequest(url, payload) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({
            success: false,
            message: 'Unexpected server response.'
        }));

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Request failed.');
        }

        return data;
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
            const data = await sendAuthRequest('php/login.php', { username, password });
            localStorage.setItem('currentUser', JSON.stringify(data.user));
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
            const data = await sendAuthRequest('php/register.php', {
                username,
                email,
                password,
                confirmPassword
            });
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            showAlert('success', 'Registration successful! Redirecting...');
            setTimeout(() => window.location.href = 'pages/homePage.html', 500);
        } catch (error) {
            showAlert('error', error.message || 'Registration failed.');
        } finally {
            setButtonState(submitButton, false, 'Register');
        }
    });

});
