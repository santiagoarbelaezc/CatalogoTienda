<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Models\Talla;
use App\Utils\Response;
use App\Utils\Validator;

final class TallaController extends BaseController
{
    private Talla $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new Talla($this->pdo);
    }

    public function index(): void
    {
        Response::success($this->model->findAll());
    }

    public function show(array $params): void
    {
        $talla = $this->model->findById((int) $params['id']);
        if ($talla === null) throw new NotFoundException("Talla #{$params['id']} no encontrada.");
        Response::success($talla);
    }

    public function store(): void
    {
        $v = new Validator($this->body());
        $v->required(['nombre'])
          ->maxLength('nombre', 20)
          ->optional(['orden'])
          ->positiveInt(['orden']);
        $data = $v->validateOrFail();

        $id = $this->model->create($data['nombre'], (int) ($data['orden'] ?? 0));
        Response::created($this->model->findById($id), "/api/tallas/{$id}");
    }

    public function update(array $params): void
    {
        $id = (int) $params['id'];
        if (!$this->model->existsById($id)) throw new NotFoundException("Talla #{$id} no encontrada.");

        $v = new Validator($this->body());
        $v->required(['nombre'])
          ->maxLength('nombre', 20)
          ->optional(['orden'])
          ->positiveInt(['orden']);
        $data = $v->validateOrFail();

        $this->model->update($id, $data['nombre'], (int) ($data['orden'] ?? 0));
        Response::success($this->model->findById($id));
    }

    public function destroy(array $params): void
    {
        $id = (int) $params['id'];
        if (!$this->model->existsById($id)) throw new NotFoundException("Talla #{$id} no encontrada.");
        $this->model->delete($id);
        Response::noContent();
    }
}
