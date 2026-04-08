<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$controller = new App\Controllers\UserController();
$controller->current();
