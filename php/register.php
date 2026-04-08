<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$controller = new App\Controllers\AuthController(
    new App\Models\UserModel(App\Core\Database::connection())
);
$controller->register();
