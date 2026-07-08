<?php

declare(strict_types=1);

namespace App\Utils;

use App\Exceptions\ValidationException;

/**
 * Helper para emitir respuestas JSON estandarizadas.
 *
 * Todas las respuestas siguen la estructura:
 * {
 *   "success": bool,
 *   "data":    mixed,  // solo en éxito
 *   "message": string, // solo en error
 *   "errors":  object, // solo en 422 ValidationException
 *   "meta":    object  // paginación u otros metadatos
 * }
 */
final class Response
{
    /**
     * Respuesta de éxito (2xx).
     *
     * @param mixed $data
     * @param array<string, mixed> $meta
     */
    public static function success(mixed $data, int $code = 200, array $meta = []): never
    {
        http_response_code($code);

        $body = ['success' => true, 'data' => $data];

        if (!empty($meta)) {
            $body['meta'] = $meta;
        }

        self::send($body);
    }

    /**
     * Respuesta de error (4xx / 5xx).
     *
     * @param array<string, mixed> $extra Datos adicionales (solo en modo debug)
     */
    public static function error(string $message, int $code = 400, array $extra = []): never
    {
        http_response_code($code);

        $body = [
            'success' => false,
            'message' => $message,
        ];

        if (!empty($extra)) {
            $body = array_merge($body, $extra);
        }

        self::send($body);
    }

    /**
     * Respuesta de error de validación (422).
     *
     * @param array<string, string[]> $errors
     */
    public static function validationError(array $errors, string $message = 'Los datos enviados no son válidos.'): never
    {
        http_response_code(422);

        self::send([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ]);
    }

    /** Respuesta 201 Created con Location header */
    public static function created(mixed $data, string $location = ''): never
    {
        if ($location !== '') {
            header("Location: {$location}");
        }

        self::success($data, 201);
    }

    /** Respuesta 204 No Content */
    public static function noContent(): never
    {
        http_response_code(204);
        exit;
    }

    /** @param array<string, mixed> $body */
    private static function send(array $body): never
    {
        // Header ya establecido por Cors::handle(), pero garantizamos JSON
        header('Content-Type: application/json; charset=UTF-8');

        echo json_encode(
            $body,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
        );
        exit;
    }
}
