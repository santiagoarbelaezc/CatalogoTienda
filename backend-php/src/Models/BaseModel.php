<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

/**
 * Modelo base — provee helpers de acceso a datos reutilizables.
 * Los modelos hijos actúan como repositorios: encapsulan toda la lógica SQL.
 */
abstract class BaseModel
{
    public function __construct(protected readonly PDO $pdo) {}

    // ── Helpers de consulta ───────────────────────────────────────────

    /**
     * Ejecuta una query con bindings y retorna todos los resultados.
     *
     * @param array<string|int, mixed> $bindings
     * @return array<int, array<string, mixed>>
     */
    protected function fetchAll(string $sql, array $bindings = []): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($bindings);
        return $stmt->fetchAll();
    }

    /**
     * Ejecuta una query y retorna la primera fila o null.
     *
     * @param array<string|int, mixed> $bindings
     * @return array<string, mixed>|null
     */
    protected function fetchOne(string $sql, array $bindings = []): ?array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($bindings);
        $result = $stmt->fetch();
        return $result !== false ? $result : null;
    }

    /**
     * Ejecuta una query sin retorno de datos (INSERT, UPDATE, DELETE).
     *
     * @param array<string|int, mixed> $bindings
     */
    protected function execute(string $sql, array $bindings = []): int
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($bindings);
        return $stmt->rowCount();
    }

    /**
     * Ejecuta un INSERT y retorna el último ID insertado.
     *
     * @param array<string|int, mixed> $bindings
     */
    protected function insert(string $sql, array $bindings = []): int
    {
        $this->execute($sql, $bindings);
        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Cuenta filas con una query COUNT.
     *
     * @param array<string|int, mixed> $bindings
     */
    protected function count(string $sql, array $bindings = []): int
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($bindings);
        return (int) $stmt->fetchColumn();
    }
}
