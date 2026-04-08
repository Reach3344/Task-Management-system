<?php

declare(strict_types=1);

const USER_STORAGE_PATH = __DIR__ . '/storage/users.json';
const SESSION_STORAGE_PATH = __DIR__ . '/storage/sessions';

ensure_directory(dirname(USER_STORAGE_PATH));
ensure_directory(SESSION_STORAGE_PATH);
session_save_path(SESSION_STORAGE_PATH);
session_start();

function ensure_directory(string $path): void
{
    if (!is_dir($path)) {
        mkdir($path, 0777, true);
    }
}

function send_json(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ensure_user_storage(): void
{
    if (!file_exists(USER_STORAGE_PATH)) {
        $seedUsers = [[
            'id' => 1,
            'username' => 'admin',
            'email' => 'admin@gmail.com',
            'password' => password_hash('admin123', PASSWORD_DEFAULT),
            'created_at' => date(DATE_ATOM),
            'last_login' => null,
            'login_count' => 0,
        ]];

        file_put_contents(USER_STORAGE_PATH, json_encode($seedUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }
}

function read_json_input(): array
{
    $rawInput = file_get_contents('php://input');

    if ($rawInput === false || trim($rawInput) === '') {
        return [];
    }

    $decoded = json_decode($rawInput, true);

    if (!is_array($decoded)) {
        send_json(400, [
            'success' => false,
            'message' => 'Invalid request body.',
        ]);
    }

    return $decoded;
}

function load_users(): array
{
    ensure_user_storage();

    $content = file_get_contents(USER_STORAGE_PATH);

    if ($content === false || trim($content) === '') {
        return [];
    }

    $users = json_decode($content, true);

    return is_array($users) ? $users : [];
}

function save_users(array $users): void
{
    ensure_user_storage();

    $encoded = json_encode(array_values($users), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

    if ($encoded === false) {
        send_json(500, [
            'success' => false,
            'message' => 'Failed to save users.',
        ]);
    }

    file_put_contents(USER_STORAGE_PATH, $encoded, LOCK_EX);
}

function public_user(array $user): array
{
    return [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'createdAt' => $user['created_at'],
        'lastLogin' => $user['last_login'],
        'loginCount' => $user['login_count'] ?? 0,
    ];
}

function require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $method) {
        send_json(405, [
            'success' => false,
            'message' => 'Method not allowed.',
        ]);
    }
}
