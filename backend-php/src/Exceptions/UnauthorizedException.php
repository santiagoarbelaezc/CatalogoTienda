<?php

declare(strict_types=1);

namespace App\Exceptions;

final class UnauthorizedException extends HttpException
{
    public function __construct(string $message = 'No autenticado. Token requerido.', ?\Throwable $previous = null)
    {
        parent::__construct($message, 401, $previous);
    }
}
