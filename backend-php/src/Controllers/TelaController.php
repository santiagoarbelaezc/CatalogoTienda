<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Models\Tela;
use App\Utils\Response;
use App\Utils\Validator;

final class TelaController extends BaseController
{
    private Tela $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new Tela($this->pdo);
    }

    public function index(): void
    {
        Response::success($this->model->findAll());
    }

    public function show(array $params): void
    {
        $tela = $this->model->findById((int) $params['id']);
        if ($tela === null) throw new NotFoundException("Tela #{$params['id']} no encontrada.");
        Response::success($tela);
    }

    public function store(): void
    {
        $v = new Validator($this->body());
        $v->required(['nombre', 'composicion'])
          ->maxLength('nombre', 100)
          ->maxLength('composicion', 255);
        $data = $v->validateOrFail();

        $id = $this->model->create($data['nombre'], $data['composicion']);
        Response::created($this->model->findById($id), "/api/telas/{$id}");
    }

    public function update(array $params): void
    {
        $id = (int) $params['id'];
        if (!$this->model->existsById($id)) throw new NotFoundException("Tela #{$id} no encontrada.");

        $v = new Validator($this->body());
        $v->required(['nombre', 'composicion'])
          ->maxLength('nombre', 100)
          ->maxLength('composicion', 255);
        $data = $v->validateOrFail();

        $this->model->update($id, $data['nombre'], $data['composicion']);
        Response::success($this->model->findById($id));
    }

    public function destroy(array $params): void
    {
        $id = (int) $params['id'];
        if (!$this->model->existsById($id)) throw new NotFoundException("Tela #{$id} no encontrada.");
        $this->model->delete($id);
        Response::noContent();
    }
}
