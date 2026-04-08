<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    send_json(401, [
        'success' => false,
        'message' => 'Not authenticated.',
    ]);
}

send_json(200, [
    'success' => true,
    'user' => $_SESSION['user'],
]);
