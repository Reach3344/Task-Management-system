<?php

declare(strict_types=1);

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

function require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $method) {
        send_json(405, [
            'success' => false,
            'message' => 'Method not allowed.',
        ]);
    }
}
