<?php

declare(strict_types=1);

namespace App\Config;

/**
 * Gestión de cabeceras CORS.
 *
 * Orígenes permitidos se configuran en .env → CORS_ALLOWED_ORIGINS
 * (separados por coma). En desarrollo, se acepta localhost:4200 (Angular).
 */
final class Cors
{
    public static function handle(): void
    {
        $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = self::getAllowedOrigins();

        if ($origin !== '' && in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        } elseif (empty($allowed)) {
            // Sin configuración → solo para desarrollo local
            header('Access-Control-Allow-Origin: *');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 3600');
        header('Content-Type: application/json; charset=UTF-8');
    }

    /** @return string[] */
    private static function getAllowedOrigins(): array
    {
        $raw = $_ENV['CORS_ALLOWED_ORIGINS'] ?? '';

        if ($raw === '') {
            return [];
        }

        return array_map(
            'trim',
            explode(',', $raw)
        );
    }
}
