<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
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
        $raw = $this->body();

        // Normalizar llaves anidadas enviadas desde el cliente ({ categoria: { id: 1 } })
        if (!isset($raw['id_categoria']) && isset($raw['categoria']['id'])) {
            $raw['id_categoria'] = $raw['categoria']['id'];
        }
        if (!isset($raw['id_marca']) && isset($raw['marca']['id'])) {
            $raw['id_marca'] = $raw['marca']['id'];
        }
        if (!isset($raw['id_tela']) && isset($raw['tela']['id'])) {
            $raw['id_tela'] = $raw['tela']['id'];
        }

        $v = new Validator($raw);
        $v->required(['nombre', 'precio_base', 'id_categoria', 'id_marca'])
          ->minLength('nombre', 3)
          ->maxLength('nombre', 200)
          ->numeric(['precio_base', 'id_categoria', 'id_marca'])
          ->positiveNumeric(['precio_base'])
          ->inList('genero', ['Hombre', 'Mujer', 'Unisex'])
          ->optional(['descripcion', 'genero', 'temporada', 'activo', 'id_tela']);

        $data = $v->validateOrFail();
        $this->validateForeignKeys($data);

        $variantes = $raw['variantes'] ?? [];
        if (!is_array($variantes) || empty($variantes)) {
            throw new ValidationException([
                'variantes' => ['El producto debe incluir al menos una variante con SKU, talla y color.']
            ]);
        }

        $varianteModel = new \App\Models\Variante($this->pdo);
        $seenSkus = [];

        foreach ($variantes as $idx => $var) {
            $sku = strtoupper(trim((string)($var['sku'] ?? '')));
            if ($sku === '') {
                throw new ValidationException([
                    "variantes.{$idx}.sku" => ["El SKU de la variante #" . ($idx + 1) . " no puede estar vacío."]
                ]);
            }

            if (in_array($sku, $seenSkus, true)) {
                throw new ValidationException([
                    "variantes.{$idx}.sku" => ["El SKU '{$sku}' está duplicado en la lista enviada."]
                ]);
            }
            $seenSkus[] = $sku;

            if ($varianteModel->skuExists($sku)) {
                throw new ValidationException([
                    "variantes.{$idx}.sku" => ["El SKU '{$sku}' ya se encuentra registrado en la base de datos."]
                ]);
            }

            $precio = isset($var['precio']) ? (float)$var['precio'] : (float)$data['precio_base'];
            if ($precio < 0) {
                throw new ValidationException([
                    "variantes.{$idx}.precio" => ["El precio de la variante '{$sku}' no puede ser negativo."]
                ]);
            }

            $stock = isset($var['stock']) ? (int)$var['stock'] : 0;
            if ($stock < 0) {
                throw new ValidationException([
                    "variantes.{$idx}.stock" => ["El stock de la variante '{$sku}' no puede ser negativo."]
                ]);
            }
        }

        $id = $this->model->create($data);

        foreach ($variantes as $variant) {
            $sku = strtoupper(trim((string)$variant['sku']));
            $varianteModel->create([
                'id_producto' => $id,
                'id_color'    => $variant['color']['id'] ?? $variant['id_color'] ?? null,
                'id_talla'    => $variant['talla']['id'] ?? $variant['id_talla'] ?? null,
                'sku'         => $sku,
                'precio'      => isset($variant['precio']) ? (float)$variant['precio'] : (float)$data['precio_base'],
                'stock'       => isset($variant['stock']) ? (int)$variant['stock'] : 0,
            ]);
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

        $raw = $this->body();

        if (!isset($raw['id_categoria']) && isset($raw['categoria']['id'])) {
            $raw['id_categoria'] = $raw['categoria']['id'];
        }
        if (!isset($raw['id_marca']) && isset($raw['marca']['id'])) {
            $raw['id_marca'] = $raw['marca']['id'];
        }
        if (!isset($raw['id_tela']) && isset($raw['tela']['id'])) {
            $raw['id_tela'] = $raw['tela']['id'];
        }

        $v = new Validator($raw);
        $v->required(['nombre', 'precio_base', 'id_categoria', 'id_marca'])
          ->minLength('nombre', 3)
          ->maxLength('nombre', 200)
          ->numeric(['precio_base', 'id_categoria', 'id_marca'])
          ->positiveNumeric(['precio_base'])
          ->inList('genero', ['Hombre', 'Mujer', 'Unisex'])
          ->optional(['descripcion', 'genero', 'temporada', 'activo', 'id_tela']);

        $data = $v->validateOrFail();
        $this->validateForeignKeys($data);

        $variantes = $raw['variantes'] ?? [];
        if (!is_array($variantes) || empty($variantes)) {
            throw new ValidationException([
                'variantes' => ['El producto debe mantener al menos una variante activa.']
            ]);
        }

        $varianteModel = new \App\Models\Variante($this->pdo);
        $existingVariantes = $varianteModel->findByProducto($id);
        $existingIds = array_map(fn($var) => (int) $var['id'], $existingVariantes);

        $seenSkus = [];
        foreach ($variantes as $idx => $var) {
            $sku = strtoupper(trim((string)($var['sku'] ?? '')));
            if ($sku === '') {
                throw new ValidationException([
                    "variantes.{$idx}.sku" => ["El SKU de la variante #" . ($idx + 1) . " no puede estar vacío."]
                ]);
            }

            if (in_array($sku, $seenSkus, true)) {
                throw new ValidationException([
                    "variantes.{$idx}.sku" => ["El SKU '{$sku}' está duplicado en la lista enviada."]
                ]);
            }
            $seenSkus[] = $sku;

            $vId = isset($var['id']) ? (int) $var['id'] : null;
            if ($varianteModel->skuExists($sku, $vId)) {
                $existingBySku = $varianteModel->findBySku($sku);
                if (!$existingBySku || (int)$existingBySku['id_producto'] !== $id) {
                    throw new ValidationException([
                        "variantes.{$idx}.sku" => ["El SKU '{$sku}' ya se encuentra registrado en otro producto."]
                    ]);
                }
            }

            $precio = isset($var['precio']) ? (float)$var['precio'] : (float)$data['precio_base'];
            if ($precio < 0) {
                throw new ValidationException([
                    "variantes.{$idx}.precio" => ["El precio de la variante '{$sku}' no puede ser negativo."]
                ]);
            }

            $stock = isset($var['stock']) ? (int)$var['stock'] : 0;
            if ($stock < 0) {
                throw new ValidationException([
                    "variantes.{$idx}.stock" => ["El stock de la variante '{$sku}' no puede ser negativo."]
                ]);
            }
        }

        $this->model->update($id, $data);

        $sentIds = [];
        foreach ($variantes as $variant) {
            $vId = isset($variant['id']) ? (int) $variant['id'] : null;
            $sku = strtoupper(trim((string)$variant['sku']));
            $vData = [
                'id_producto' => $id,
                'id_color'    => $variant['color']['id'] ?? $variant['id_color'] ?? null,
                'id_talla'    => $variant['talla']['id'] ?? $variant['id_talla'] ?? null,
                'sku'         => $sku,
                'precio'      => isset($variant['precio']) ? (float)$variant['precio'] : (float)$data['precio_base'],
                'stock'       => isset($variant['stock']) ? (int)$variant['stock'] : 0,
            ];

            if ($vId && in_array($vId, $existingIds, true)) {
                $varianteModel->update($vId, $vData);
                $sentIds[] = $vId;
            } else {
                $existingBySku = $varianteModel->findBySku($sku);
                if ($existingBySku && (int) $existingBySku['id_producto'] === $id) {
                    $skuId = (int) $existingBySku['id'];
                    $varianteModel->update($skuId, $vData);
                    $sentIds[] = $skuId;
                } else {
                    $newId = $varianteModel->create($vData);
                    $sentIds[] = $newId;
                }
            }
        }

        foreach ($existingIds as $exId) {
            if (!in_array($exId, $sentIds, true)) {
                $varianteModel->delete($exId);
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

        $query = $this->queryAll();
        if (isset($query['force']) && filter_var($query['force'], FILTER_VALIDATE_BOOLEAN)) {
            $this->model->hardDelete($id);
        } else {
            $this->model->softDelete($id);
        }

        Response::noContent();
    }

    private function validateForeignKeys(array $data): void
    {
        if (isset($data['id_categoria'])) {
            $catId = (int) $data['id_categoria'];
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM categorias WHERE id = ?");
            $stmt->execute([$catId]);
            if ((int)$stmt->fetchColumn() === 0) {
                throw new ValidationException([
                    'id_categoria' => ["La categoría con ID {$catId} no existe en el catálogo."]
                ]);
            }
        }

        if (isset($data['id_marca'])) {
            $marcaId = (int) $data['id_marca'];
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM marcas WHERE id = ?");
            $stmt->execute([$marcaId]);
            if ((int)$stmt->fetchColumn() === 0) {
                throw new ValidationException([
                    'id_marca' => ["La marca con ID {$marcaId} no existe en el catálogo."]
                ]);
            }
        }
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
