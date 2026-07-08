<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use PDO;

/**
 * Controlador base.
 * Provee acceso a PDO y helpers de lectura de input.
 */
abstract class BaseController
{
    protected readonly PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getInstance()->getConnection();
    }

    /**
     * Devuelve el body parseado (JSON o multipart).
     *
     * @return array<string, mixed>
     */
    protected function body(): array
    {
        return $_POST ?? [];
    }

    /**
     * Lee un query param con valor por defecto.
     */
    protected function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    /**
     * Devuelve todos los query params.
     *
     * @return array<string, mixed>
     */
    protected function queryAll(): array
    {
        return $_GET ?? [];
    }

    /**
     * Lee el id del usuario autenticado desde el JWT payload.
     */
    protected function authUserId(): int
    {
        return (int) ($_REQUEST['auth_user']->sub ?? 0);
    }
}
