<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Models\Categoria;
use App\Utils\Response;
use App\Utils\Validator;

final class CategoriaController extends BaseController
{
    private Categoria $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new Categoria($this->pdo);
    }

    public function index(): void
    {
        $format = $this->query('format', 'tree');

        $data = $format === 'flat'
            ? $this->model->findAll()
            : $this->model->findTree();

        Response::success($data);
    }

    public function show(array $params): void
    {
        $id  = (int) $params['id'];
        $cat = $this->model->findById($id);

        if ($cat === null) {
            throw new NotFoundException("Categoría #{$id} no encontrada.");
        }

        Response::success($cat);
    }

    public function store(): void
    {
        $v = new Validator($this->body());
        $v->required(['nombre'])
          ->maxLength('nombre', 100)
          ->optional(['id_padre']);

        $data = $v->validateOrFail();

        $idPadre = isset($data['id_padre']) ? (int) $data['id_padre'] : null;

        if ($idPadre !== null && !$this->model->existsById($idPadre)) {
            Response::error("La categoría padre #{$idPadre} no existe.", 422);
        }

        $id = $this->model->create($data['nombre'], $idPadre);

        Response::created($this->model->findById($id), "/api/categorias/{$id}");
    }

    public function update(array $params): void
    {
        $id = (int) $params['id'];

        if (!$this->model->existsById($id)) {
            throw new NotFoundException("Categoría #{$id} no encontrada.");
        }

        $v = new Validator($this->body());
        $v->required(['nombre'])
          ->maxLength('nombre', 100)
          ->optional(['id_padre']);

        $data    = $v->validateOrFail();
        $idPadre = isset($data['id_padre']) ? (int) $data['id_padre'] : null;

        // Prevenir auto-referencia directa
        if ($idPadre === $id) {
            Response::error('Una categoría no puede ser su propio padre.', 422);
        }

        $this->model->update($id, $data['nombre'], $idPadre);

        Response::success($this->model->findById($id));
    }

    public function destroy(array $params): void
    {
        $id = (int) $params['id'];

        if (!$this->model->existsById($id)) {
            throw new NotFoundException("Categoría #{$id} no encontrada.");
        }

        $this->model->delete($id);

        Response::noContent();
    }
}
