<?php

declare(strict_types=1);

const APP_ROOT = __DIR__ . '/..';
const CONFIG_ROOT = APP_ROOT . '/../config';
const STORAGE_ROOT = APP_ROOT . '/../storage';
const SESSION_STORAGE_PATH = STORAGE_ROOT . '/sessions';

require_once __DIR__ . '/helpers.php';

spl_autoload_register(static function (string $className): void {
    $prefix = 'App\\';

    if (!str_starts_with($className, $prefix)) {
        return;
    }

    $relativeClass = substr($className, strlen($prefix));
    $path = APP_ROOT . '/' . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($path)) {
        require_once $path;
    }
});

ensure_directory(STORAGE_ROOT);
ensure_directory(SESSION_STORAGE_PATH);

session_save_path(SESSION_STORAGE_PATH);
session_start();
