<?php

declare(strict_types=1);

namespace App\Exceptions;

final class ForbiddenException extends HttpException
{
    public function __construct(string $message = 'Acceso denegado.', ?\Throwable $previous = null)
    {
        parent::__construct($message, 403, $previous);
    }
}
