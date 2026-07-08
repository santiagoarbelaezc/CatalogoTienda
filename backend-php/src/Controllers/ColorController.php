<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Models\Color;
use App\Utils\Response;
use App\Utils\Validator;

final class ColorController extends BaseController
{
    private Color $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new Color($this->pdo);
    }

    public function index(): void
    {
        Response::success($this->model->findAll());
    }

    public function show(array $params): void
    {
        $color = $this->model->findById((int) $params['id']);
        if ($color === null) throw new NotFoundException("Color #{$params['id']} no encontrado.");
        Response::success($color);
    }

    public function store(): void
    {
        $v = new Validator($this->body());
        $v->required(['nombre', 'hex'])
          ->maxLength('nombre', 100)
          ->hexColor('hex');
        $data = $v->validateOrFail();

        $id = $this->model->create($data['nombre'], $data['hex']);
        Response::created($this->model->findById($id), "/api/colores/{$id}");
    }

    public function update(array $params): void
    {
        $id = (int) $params['id'];
        if (!$this->model->existsById($id)) throw new NotFoundException("Color #{$id} no encontrado.");

        $v = new Validator($this->body());
        $v->required(['nombre', 'hex'])
          ->maxLength('nombre', 100)
          ->hexColor('hex');
        $data = $v->validateOrFail();

        $this->model->update($id, $data['nombre'], $data['hex']);
        Response::success($this->model->findById($id));
    }

    public function destroy(array $params): void
    {
        $id = (int) $params['id'];
        if (!$this->model->existsById($id)) throw new NotFoundException("Color #{$id} no encontrado.");
        $this->model->delete($id);
        Response::noContent();
    }
}
