<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');

$input = read_json_input();
$username = trim((string)($input['username'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($username === '' || $password === '') {
    send_json(422, [
        'success' => false,
        'message' => 'Username and password are required.',
    ]);
}

$users = load_users();

foreach ($users as $index => $user) {
    if (($user['username'] ?? '') !== $username) {
        continue;
    }

    if (!password_verify($password, $user['password'] ?? '')) {
        break;
    }

    $users[$index]['login_count'] = (int)($user['login_count'] ?? 0) + 1;
    $users[$index]['last_login'] = date(DATE_ATOM);

    save_users($users);

    $_SESSION['user'] = public_user($users[$index]);

    send_json(200, [
        'success' => true,
        'message' => 'Login successful.',
        'user' => $_SESSION['user'],
    ]);
}

send_json(401, [
    'success' => false,
    'message' => 'Invalid username or password.',
]);
