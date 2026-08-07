<?php

declare(strict_types=1);

/**
 * Entry point para el servidor integrado de PHP (php -S localhost:8000 index.php)
 * Redirige la ejecución a public/index.php.
 */

if (php_sapi_name() === 'cli-server') {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $file = __DIR__ . '/public' . $path;
    if ($path !== '/' && file_exists($file) && !is_dir($file)) {
        return false; // Servir archivos estáticos (imágenes, etc.) directamente
    }
}

require __DIR__ . '/public/index.php';
