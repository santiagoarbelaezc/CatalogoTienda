<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Models\Variante;
use App\Models\Producto;
use App\Utils\Response;
use App\Utils\Validator;

final class VarianteController extends BaseController
{
    private Variante $model;
    private Producto $productoModel;

    public function __construct()
    {
        parent::__construct();
        $this->model         = new Variante($this->pdo);
        $this->productoModel = new Producto($this->pdo);
    }

    public function indexByProducto(array $params): void
    {
        $productoId = (int) $params['id'];

        if (!$this->productoModel->existsById($productoId)) {
            throw new NotFoundException("Producto #{$productoId} no encontrado.");
        }

        Response::success($this->model->findByProducto($productoId));
    }

    public function store(): void
    {
        $body = $this->body();

        $v = new Validator($body);
        $v->required(['id_producto', 'sku', 'precio'])
          ->positiveInt(['id_producto', 'stock'])
          ->numeric(['precio'])
          ->positiveNumeric(['precio'])
          ->sku('sku')
          ->optional(['id_color', 'id_talla', 'stock']);

        $data = $v->validateOrFail();

        if (!$this->productoModel->existsById((int) $data['id_producto'])) {
            throw new NotFoundException("Producto #{$data['id_producto']} no encontrado.");
        }

        if ($this->model->skuExists($data['sku'])) {
            Response::error("El SKU '{$data['sku']}' ya existe.", 409);
        }

        $id       = $this->model->create($data);
        $variante = $this->model->findById($id);

        Response::created($variante, "/api/variantes/{$id}");
    }

    public function update(array $params): void
    {
        $id = (int) $params['id'];

        if (!$this->model->existsById($id)) {
            throw new NotFoundException("Variante #{$id} no encontrada.");
        }

        $body = $this->body();

        $v = new Validator($body);
        $v->required(['sku', 'precio', 'stock'])
          ->numeric(['precio'])
          ->positiveNumeric(['precio'])
          ->positiveInt(['stock'])
          ->sku('sku')
          ->optional(['id_color', 'id_talla']);

        $data = $v->validateOrFail();

        if ($this->model->skuExists($data['sku'], $id)) {
            Response::error("El SKU '{$data['sku']}' ya pertenece a otra variante.", 409);
        }

        $this->model->update($id, $data);

        Response::success($this->model->findById($id));
    }

    public function destroy(array $params): void
    {
        $id = (int) $params['id'];

        if (!$this->model->existsById($id)) {
            throw new NotFoundException("Variante #{$id} no encontrada.");
        }

        $this->model->delete($id);

        Response::noContent();
    }

    public function lowStock(): void
    {
        $threshold = (int) ($this->query('threshold', 5));
        Response::success($this->model->getLowStock($threshold));
    }
}
