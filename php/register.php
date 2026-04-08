<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');

$input = read_json_input();
$username = trim((string)($input['username'] ?? ''));
$email = trim((string)($input['email'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($username === '' || $email === '' || $password === '') {
    send_json(422, [
        'success' => false,
        'message' => 'Username, email, and password are required.',
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(422, [
        'success' => false,
        'message' => 'Please enter a valid email address.',
    ]);
}

if (strlen($password) < 6) {
    send_json(422, [
        'success' => false,
        'message' => 'Password must be at least 6 characters.',
    ]);
}

$users = load_users();

foreach ($users as $user) {
    if (strcasecmp($user['username'] ?? '', $username) === 0) {
        send_json(409, [
            'success' => false,
            'message' => 'Username already exists.',
        ]);
    }

    if (strcasecmp($user['email'] ?? '', $email) === 0) {
        send_json(409, [
            'success' => false,
            'message' => 'Email already registered.',
        ]);
    }
}

$newUser = [
    'id' => empty($users) ? 1 : (max(array_column($users, 'id')) + 1),
    'username' => $username,
    'email' => $email,
    'password' => password_hash($password, PASSWORD_DEFAULT),
    'created_at' => date(DATE_ATOM),
    'last_login' => date(DATE_ATOM),
    'login_count' => 1,
];

$users[] = $newUser;

save_users($users);

$_SESSION['user'] = public_user($newUser);

send_json(201, [
    'success' => true,
    'message' => 'Registration successful.',
    'user' => $_SESSION['user'],
]);
