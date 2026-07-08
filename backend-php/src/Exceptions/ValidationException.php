<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * Excepción de validación — 422 Unprocessable Entity.
 * Lleva un mapa de errores por campo para facilitar respuestas claras al cliente.
 */
final class ValidationException extends HttpException
{
    /** @param array<string, string[]> $errors */
    public function __construct(
        private readonly array $errors,
        string $message = 'Los datos enviados no son válidos.',
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, 422, $previous);
    }

    /** @return array<string, string[]> */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
