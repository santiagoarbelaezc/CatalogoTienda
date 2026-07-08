<?php

declare(strict_types=1);

/**
 * Entry point — API Catálogo Tienda Íntima
 *
 * En Hostinger, este archivo vive en:
 *   public_html/api/index.php
 *
 * El directorio padre (backend-php/) debe estar FUERA de public_html
 * o protegido con .htaccess para que solo index.php sea accesible.
 */

// Directorio raíz del proyecto (un nivel arriba de public/)
define('BASE_PATH', dirname(__DIR__));

// Autoloading PSR-4 vía Composer
require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\App;

// Carga variables de entorno desde .env
$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad(); // safeLoad no lanza excepción si .env no existe (p. ej. en CI)

// Arranca la aplicación
App::bootstrap();
