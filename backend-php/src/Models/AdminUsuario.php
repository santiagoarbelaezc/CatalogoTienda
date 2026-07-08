<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

final class AdminUsuario extends BaseModel
{
    public static function findActiveById(PDO $pdo, int $id): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM admin_usuarios WHERE id = ? AND activo = 1');
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result !== false ? $result : null;
    }

    public function findByEmail(string $email): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM admin_usuarios WHERE email = ? AND activo = 1',
            [strtolower(trim($email))]
        );
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne(
            'SELECT id, email, nombre, activo, creado_en FROM admin_usuarios WHERE id = ?',
            [$id]
        );
    }
}
