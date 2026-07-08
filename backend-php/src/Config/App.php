<?php

declare(strict_types=1);

namespace App\Config;

use App\Exceptions\HttpException;
use App\Routes\Router;
use App\Utils\Response;
use Throwable;

/**
 * Núcleo de la aplicación.
 * Configura error handling, CORS, parseo de body y despacha el router.
 */
final class App
{
    public static function bootstrap(): void
    {
        // ── Manejo global de errores ──────────────────────────────────
        set_exception_handler([self::class, 'handleException']);
        set_error_handler([self::class, 'handlePhpError']);
        ini_set('display_errors', '0');
        error_reporting(E_ALL);

        // ── Zona horaria ──────────────────────────────────────────────
        date_default_timezone_set('America/Bogota');

        // ── Cabeceras CORS ────────────────────────────────────────────
        Cors::handle();

        // ── Preflight OPTIONS (CORS) ──────────────────────────────────
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        // ── Parsear body JSON ─────────────────────────────────────────
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($contentType, 'application/json')) {
            $raw  = file_get_contents('php://input');
            $body = json_decode($raw, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Response::error('JSON inválido en el cuerpo de la petición', 400);
                exit;
            }

            $_POST = $body ?? [];
        }

        // ── Router ────────────────────────────────────────────────────
        $router = new Router();
        require BASE_PATH . '/src/Routes/api.php';

        $method = $_SERVER['REQUEST_METHOD'];
        $uri    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

        // Eliminar el prefijo /api si la API está montada en un subdirectorio
        $apiPrefix = rtrim($_ENV['API_PREFIX'] ?? '/api', '/');
        if ($apiPrefix !== '' && str_starts_with($uri, $apiPrefix)) {
            $uri = substr($uri, strlen($apiPrefix));
        }

        $uri = '/' . ltrim($uri ?: '/', '/');

        $router->dispatch($method, $uri);
    }

    public static function handleException(Throwable $e): void
    {
        $debug = filter_var($_ENV['APP_DEBUG'] ?? 'false', FILTER_VALIDATE_BOOLEAN);

        $statusCode = ($e instanceof HttpException)
            ? $e->getStatusCode()
            : 500;

        $payload = ['message' => $e->getMessage()];

        if ($debug) {
            $payload['exception'] = get_class($e);
            $payload['file']      = $e->getFile();
            $payload['line']      = $e->getLine();
            $payload['trace']     = explode("\n", $e->getTraceAsString());
        }

        error_log(sprintf(
            '[%s] %s | %s:%d',
            date('Y-m-d H:i:s'),
            $e->getMessage(),
            $e->getFile(),
            $e->getLine()
        ));

        Response::error($e->getMessage(), $statusCode, $debug ? $payload : []);
    }

    /**
     * Convierte errores PHP en excepciones para manejo uniforme.
     */
    public static function handlePhpError(int $errno, string $errstr, string $errfile, int $errline): bool
    {
        if (!(error_reporting() & $errno)) {
            return false;
        }

        if ($errno === E_DEPRECATED || $errno === E_USER_DEPRECATED) {
            return false;
        }

        throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
    }
}
