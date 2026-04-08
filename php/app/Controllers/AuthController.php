<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\UserModel;

final class AuthController
{
    public function __construct(
        private readonly ?UserModel $users = null
    ) {
    }

    public function login(): never
    {
        require_method('POST');

        $input = read_json_input();
        $username = trim((string) ($input['username'] ?? ''));
        $password = (string) ($input['password'] ?? '');

        if ($username === '' || $password === '') {
            send_json(422, [
                'success' => false,
                'message' => 'Username and password are required.',
            ]);
        }

        $user = $this->userModel()->authenticate($username, $password);

        if ($user === null) {
            send_json(401, [
                'success' => false,
                'message' => 'Invalid username or password.',
            ]);
        }

        $_SESSION['user'] = $user;

        send_json(200, [
            'success' => true,
            'message' => 'Login successful.',
            'user' => $user,
        ]);
    }

    public function register(): never
    {
        require_method('POST');

        $input = read_json_input();
        $username = trim((string) ($input['username'] ?? ''));
        $email = trim((string) ($input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        $confirmPassword = (string) ($input['confirmPassword'] ?? '');

        if ($username === '' || $email === '' || $password === '' || $confirmPassword === '') {
            send_json(422, [
                'success' => false,
                'message' => 'Username, email, password, and confirm password are required.',
            ]);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            send_json(422, [
                'success' => false,
                'message' => 'Please enter a valid email address.',
            ]);
        }

        if (!$this->hasValidEmailDomain($email)) {
            send_json(422, [
                'success' => false,
                'message' => 'Please enter an email with a valid domain.',
            ]);
        }

        if (!$this->isStrongPassword($password)) {
            send_json(422, [
                'success' => false,
                'message' => 'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
            ]);
        }

        if ($password !== $confirmPassword) {
            send_json(422, [
                'success' => false,
                'message' => 'Password and confirm password do not match.',
            ]);
        }

        $user = $this->userModel()->register($username, $email, $password);
        $_SESSION['user'] = $user;

        send_json(201, [
            'success' => true,
            'message' => 'Registration successful.',
            'user' => $user,
        ]);
    }

    public function logout(): never
    {
        require_method('POST');

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();

        send_json(200, [
            'success' => true,
            'message' => 'Logged out.',
        ]);
    }

    private function userModel(): UserModel
    {
        if ($this->users === null) {
            send_json(500, [
                'success' => false,
                'message' => 'User model is not configured.',
            ]);
        }

        return $this->users;
    }

    private function isStrongPassword(string $password): bool
    {
        return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password) === 1;
    }

    private function hasValidEmailDomain(string $email): bool
    {
        $parts = explode('@', $email);
        $domain = strtolower(trim((string) end($parts)));

        if ($domain === '') {
            return false;
        }

        if (!function_exists('checkdnsrr')) {
            return true;
        }

        return checkdnsrr($domain, 'MX') || checkdnsrr($domain, 'A') || checkdnsrr($domain, 'AAAA');
    }
}
