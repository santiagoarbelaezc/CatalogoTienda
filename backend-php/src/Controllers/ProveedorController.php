<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Models\Proveedor;
use App\Utils\Response;
use App\Utils\Validator;

final class ProveedorController extends BaseController
{
    private Proveedor $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new Proveedor($this->pdo);
    }

    public function index(): void
    {
        Response::success($this->model->findAll());
    }

    public function show(array $params): void
    {
        $prov = $this->model->findById((int) $params['id']);
        if ($prov === null) throw new NotFoundException("Proveedor #{$params['id']} no encontrado.");
        Response::success($prov);
    }

    public function store(): void
    {
        $v = new Validator($this->body());
        $v->required(['nombre'])
          ->maxLength('nombre', 150)
          ->email('email')
          ->optional(['contacto', 'email', 'telefono']);
        $data = $v->validateOrFail();

        $id = $this->model->create($data);
        Response::created($this->model->findById($id), "/api/proveedores/{$id}");
    }

    public function update(array $params): void
    {
        $id = (int) $params['id'];
        if (!$this->model->existsById($id)) throw new NotFoundException("Proveedor #{$id} no encontrado.");

        $v = new Validator($this->body());
        $v->required(['nombre'])
          ->maxLength('nombre', 150)
          ->email('email')
          ->optional(['contacto', 'email', 'telefono']);
        $data = $v->validateOrFail();

        $this->model->update($id, $data);
        Response::success($this->model->findById($id));
    }

    public function destroy(array $params): void
    {
        $id = (int) $params['id'];
        if (!$this->model->existsById($id)) throw new NotFoundException("Proveedor #{$id} no encontrado.");
        $this->model->delete($id);
        Response::noContent();
    }

    /** POST /proveedores/{id}/productos/{productoId} → asociar */
    public function attachProducto(array $params): void
    {
        $this->model->attachToProducto((int) $params['productoId'], (int) $params['id']);
        Response::success(['message' => 'Proveedor asociado al producto.']);
    }

    /** DELETE /proveedores/{id}/productos/{productoId} → desasociar */
    public function detachProducto(array $params): void
    {
        $this->model->detachFromProducto((int) $params['productoId'], (int) $params['id']);
        Response::noContent();
    }
}
