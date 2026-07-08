<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Models\Marca;
use App\Utils\Response;
use App\Utils\Validator;

final class MarcaController extends BaseController
{
    private Marca $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new Marca($this->pdo);
    }

    public function index(): void
    {
        Response::success($this->model->findAll());
    }

    public function show(array $params): void
    {
        $marca = $this->model->findById((int) $params['id']);

        if ($marca === null) {
            throw new NotFoundException("Marca #{$params['id']} no encontrada.");
        }

        Response::success($marca);
    }

    public function store(): void
    {
        $v = new Validator($this->body());
        $v->required(['nombre'])->maxLength('nombre', 100);
        $data = $v->validateOrFail();

        $id = $this->model->create($data['nombre']);
        Response::created($this->model->findById($id), "/api/marcas/{$id}");
    }

    public function update(array $params): void
    {
        $id = (int) $params['id'];

        if (!$this->model->existsById($id)) {
            throw new NotFoundException("Marca #{$id} no encontrada.");
        }

        $v = new Validator($this->body());
        $v->required(['nombre'])->maxLength('nombre', 100);
        $data = $v->validateOrFail();

        $this->model->update($id, $data['nombre']);
        Response::success($this->model->findById($id));
    }

    public function destroy(array $params): void
    {
        $id = (int) $params['id'];

        if (!$this->model->existsById($id)) {
            throw new NotFoundException("Marca #{$id} no encontrada.");
        }

        $this->model->delete($id);
        Response::noContent();
    }
}
