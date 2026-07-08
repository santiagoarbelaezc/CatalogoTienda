<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Models\Producto;
use App\Utils\Pagination;
use App\Utils\Response;
use App\Utils\Validator;

/**
 * GET    /productos           → index
 * GET    /productos/{id}      → show
 * POST   /productos           → store  (auth)
 * PUT    /productos/{id}      → update (auth)
 * DELETE /productos/{id}      → destroy (auth, soft-delete)
 */
final class ProductoController extends BaseController
{
    private Producto $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new Producto($this->pdo);
    }

    public function index(): void
    {
        $filters    = $this->queryAll();
        $pagination = Pagination::fromRequest($filters, 20);

        $result = $this->model->findAll($filters, $pagination->limit, $pagination->offset);

        Response::success($result['items'], 200, $pagination->meta($result['total']));
    }

    public function show(array $params): void
    {
        $id      = (int) $params['id'];
        $product = $this->model->findById($id);

        if ($product === null) {
            throw new NotFoundException("Producto #{$id} no encontrado.");
        }

        Response::success($product);
    }

    public function store(): void
    {
        $v = new Validator($this->body());
        $v->required(['nombre', 'precio_base'])
          ->maxLength('nombre', 200)
          ->numeric(['precio_base'])
          ->positiveNumeric(['precio_base'])
          ->inList('genero', ['Hombre', 'Mujer', 'Unisex'])
          ->optional(['descripcion', 'genero', 'temporada', 'activo',
                      'id_categoria', 'id_marca', 'id_tela']);

        $data = $v->validateOrFail();

        $id = $this->model->create($data);

        $body = $this->body();
        if (isset($body['variantes']) && is_array($body['variantes'])) {
            $varianteModel = new \App\Models\Variante($this->pdo);
            foreach ($body['variantes'] as $variant) {
                $varianteModel->create([
                    'id_producto' => $id,
                    'id_color'    => $variant['color']['id'] ?? null,
                    'id_talla'    => $variant['talla']['id'] ?? null,
                    'sku'         => $variant['sku'],
                    'precio'      => $variant['precio'] ?? $data['precio_base'],
                    'stock'       => $variant['stock'] ?? 0,
                ]);
            }
        }

        $product = $this->model->findById($id);

        Response::created($product, "/api/productos/{$id}");
    }

    public function update(array $params): void
    {
        $id = (int) $params['id'];

        if (!$this->model->existsById($id)) {
            throw new NotFoundException("Producto #{$id} no encontrado.");
        }

        $v = new Validator($this->body());
        $v->required(['nombre', 'precio_base'])
          ->maxLength('nombre', 200)
          ->numeric(['precio_base'])
          ->positiveNumeric(['precio_base'])
          ->inList('genero', ['Hombre', 'Mujer', 'Unisex'])
          ->optional(['descripcion', 'genero', 'temporada', 'activo',
                      'id_categoria', 'id_marca', 'id_tela']);

        $data = $v->validateOrFail();

        $this->model->update($id, $data);

        $body = $this->body();
        if (isset($body['variantes']) && is_array($body['variantes'])) {
            $varianteModel = new \App\Models\Variante($this->pdo);

            // Cargar variantes actuales de la BD
            $existingVariantes = $varianteModel->findByProducto($id);
            $existingIds = array_map(fn($var) => (int) $var['id'], $existingVariantes);
            $sentIds = [];

            foreach ($body['variantes'] as $variant) {
                $vId = isset($variant['id']) ? (int) $variant['id'] : null;
                $vData = [
                    'id_producto' => $id,
                    'id_color'    => $variant['color']['id'] ?? null,
                    'id_talla'    => $variant['talla']['id'] ?? null,
                    'sku'         => $variant['sku'],
                    'precio'      => $variant['precio'] ?? $data['precio_base'],
                    'stock'       => $variant['stock'] ?? 0,
                ];

                if ($vId && in_array($vId, $existingIds, true)) {
                    $varianteModel->update($vId, $vData);
                    $sentIds[] = $vId;
                } else {
                    $newId = $varianteModel->create($vData);
                    $sentIds[] = $newId;
                }
            }

            // Eliminar variantes que ya no fueron enviadas desde el frontend
            foreach ($existingIds as $exId) {
                if (!in_array($exId, $sentIds, true)) {
                    $varianteModel->delete($exId);
                }
            }
        }

        Response::success($this->model->findById($id));
    }

    public function destroy(array $params): void
    {
        $id = (int) $params['id'];

        if (!$this->model->existsById($id)) {
            throw new NotFoundException("Producto #{$id} no encontrado.");
        }

        $this->model->softDelete($id);

        Response::noContent();
    }

    public function aiHelper(): void
    {
        $data = $this->body();
        $nombre = trim((string)($data['nombre'] ?? ''));

        if ($nombre === '') {
            Response::error('El nombre del producto es requerido para utilizar la Inteligencia Artificial.', 400);
            return;
        }

        try {
            $stmt = $this->pdo->query("SELECT id, nombre FROM categorias ORDER BY id ASC");
            $categorias = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            $catContext = "";
            foreach ($categorias as $cat) {
                $catContext .= "- ID: {$cat['id']} | Nombre: {$cat['nombre']}\n";
            }

            $systemPrompt = "Eres un experto asistente de Inteligencia Artificial especializado en catálogos de comercio electrónico de moda de una tienda íntima y vestuario de alta calidad.
Tu misión es generar una descripción atractiva y persuasiva, y asignar automáticamente la mejor categoría según el nombre del producto proporcionado.

CATÁLOGO DE CATEGORÍAS DISPONIBLES EN LA TIENDA:
" . ($catContext ?: "- ID: 1 | Categoría general") . "

REGLAS DE RESPUESTA CRÍTICAS:
1. Debes responder ÚNICAMENTE con un objeto JSON válido, sin formato Markdown, sin bloques de código ```json, y sin texto adicional antes ni después.
2. El JSON debe tener exactamente la siguiente estructura:
{
  \"descripcion\": \"Una descripción persuasiva, elegante y atractiva de 2 párrafos para vender el producto en una tienda online de moda. Destaca confort, elegancia, calidad de la confección y estilo.\",
  \"categoria_id\": <entero con el ID de la categoría que mejor coincida de la lista anterior, o null si ninguna encaja>,
  \"genero\": \"<Mujer, Hombre o Unisex según corresponda al nombre del producto>\",
  \"temporada\": \"<Ej: Atemporal, Primavera-Verano, Otoño-Invierno, Colección Exclusiva>\"
}";

            $apiKey = $_ENV['GROQ_API_KEY'] ?? '';
            $apiUrl = "https://api.groq.com/openai/v1/chat/completions";

            $postData = [
                "model" => "llama-3.3-70b-versatile",
                "messages" => [
                    ["role" => "system", "content" => $systemPrompt],
                    ["role" => "user", "content" => "Genera los datos de venta y categorización para el producto llamado: '{$nombre}'"]
                ],
                "temperature" => 0.7
            ];

            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer {$apiKey}",
                "Content-Type: application/json"
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 20);

            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);

            if ($httpCode === 200 && $result) {
                $jsonResponse = json_decode($result, true);
                $content = $jsonResponse['choices'][0]['message']['content'] ?? '{}';

                $clean = preg_replace('/^```(?:json)?\s*/i', '', trim($content));
                $clean = preg_replace('/\s*```$/', '', $clean);

                $parsedData = json_decode(trim($clean), true);
                if (!is_array($parsedData) && preg_match('/\{[\s\S]*\}/', $content, $matches)) {
                    $parsedData = json_decode($matches[0], true);
                }

                if (is_array($parsedData)) {
                    Response::success($parsedData);
                    return;
                }

                Response::error('No se pudo interpretar el JSON devuelto por la IA: ' . substr($content, 0, 150), 500);
            }

            Response::error('No se pudo generar el contenido con la IA en este momento. ' . ($err ?: "Código HTTP {$httpCode}"), 500);
        } catch (\Throwable $e) {
            Response::error('Error del servidor al procesar con IA: ' . $e->getMessage(), 500);
        }
    }
}
