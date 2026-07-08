<?php

declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Singleton PDO — conexión a MySQL con lazy initialization.
 *
 * Uso:
 *   $pdo = Database::getInstance()->getConnection();
 */
final class Database
{
    private static ?Database $instance = null;
    private readonly PDO $connection;

    private function __construct()
    {
        $host    = $_ENV['DB_HOST']    ?? 'localhost';
        $port    = $_ENV['DB_PORT']    ?? '3306';
        $dbname  = $_ENV['DB_NAME']    ?? '';
        $user    = $_ENV['DB_USER']    ?? '';
        $pass    = $_ENV['DB_PASS']    ?? '';
        $charset = $_ENV['DB_CHARSET'] ?? 'utf8mb4';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->connection = new PDO($dsn, $user, $pass, $options);
            $this->connection->exec("SET NAMES {$charset} COLLATE utf8mb4_unicode_ci");
        } catch (PDOException $e) {
            // No exponemos credenciales en el mensaje público
            throw new RuntimeException('No se pudo conectar a la base de datos.', 503, $e);
        }
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function getConnection(): PDO
    {
        return $this->connection;
    }

    /** Prevenir clonado */
    private function __clone() {}
}
