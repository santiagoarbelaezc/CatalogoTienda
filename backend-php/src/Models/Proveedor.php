<?php

declare(strict_types=1);

namespace App\Models;

final class Proveedor extends BaseModel
{
    public function findAll(): array
    {
        return $this->fetchAll('SELECT * FROM proveedores ORDER BY nombre ASC');
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM proveedores WHERE id = ?', [$id]);
    }

    public function findByProducto(int $productoId): array
    {
        return $this->fetchAll(
            'SELECT p.* FROM proveedores p
             INNER JOIN producto_proveedor pp ON pp.id_proveedor = p.id
             WHERE pp.id_producto = ?
             ORDER BY p.nombre ASC',
            [$productoId]
        );
    }

    /** @param array<string, mixed> $data */
    public function create(array $data): int
    {
        return $this->insert(
            'INSERT INTO proveedores (nombre, contacto, email, telefono) VALUES (?, ?, ?, ?)',
            [
                $data['nombre'],
                $data['contacto'] ?? null,
                $data['email']    ?? null,
                $data['telefono'] ?? null,
            ]
        );
    }

    /** @param array<string, mixed> $data */
    public function update(int $id, array $data): bool
    {
        return $this->execute(
            'UPDATE proveedores SET nombre = ?, contacto = ?, email = ?, telefono = ? WHERE id = ?',
            [
                $data['nombre'],
                $data['contacto'] ?? null,
                $data['email']    ?? null,
                $data['telefono'] ?? null,
                $id,
            ]
        ) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM proveedores WHERE id = ?', [$id]) > 0;
    }

    public function attachToProducto(int $productoId, int $proveedorId): void
    {
        $this->execute(
            'INSERT IGNORE INTO producto_proveedor (id_producto, id_proveedor) VALUES (?, ?)',
            [$productoId, $proveedorId]
        );
    }

    public function detachFromProducto(int $productoId, int $proveedorId): void
    {
        $this->execute(
            'DELETE FROM producto_proveedor WHERE id_producto = ? AND id_proveedor = ?',
            [$productoId, $proveedorId]
        );
    }

    public function existsById(int $id): bool
    {
        return $this->count('SELECT COUNT(*) FROM proveedores WHERE id = ?', [$id]) > 0;
    }
}
