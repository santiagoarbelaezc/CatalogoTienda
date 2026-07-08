<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\CloudinaryConfig;
use App\Exceptions\NotFoundException;
use App\Models\Imagen;
use App\Models\Producto;
use App\Utils\Response;

/**
 * POST   /productos/{id}/imagenes   → upload a Cloudinary y guarda en BD
 * PUT    /imagenes/{id}/principal   → marca como principal
 * DELETE /imagenes/{id}             → elimina de Cloudinary + BD
 */
final class ImagenController extends BaseController
{
    private Imagen  $model;
    private Producto $productoModel;

    // Tipos MIME permitidos
    private const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    private const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    public function __construct()
    {
        parent::__construct();
        $this->model         = new Imagen($this->pdo);
        $this->productoModel = new Producto($this->pdo);
    }

    /**
     * Sube una imagen al Cloudinary y la registra en la BD.
     * Espera multipart/form-data con campo "imagen" (file).
     */
    public function upload(array $params): void
    {
        $productoId = (int) $params['id'];

        if (!$this->productoModel->existsById($productoId)) {
            throw new NotFoundException("Producto #{$productoId} no encontrado.");
        }

        // Validar límite máximo de 3 imágenes por producto
        $existing = $this->model->findByProducto($productoId);
        if (count($existing) >= 3) {
            Response::error('Este producto ya tiene el máximo de 3 imágenes permitidas.', 400);
        }

        // Validar que se recibió un archivo
        if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
            $errorCode = $_FILES['imagen']['error'] ?? UPLOAD_ERR_NO_FILE;
            Response::error($this->uploadErrorMessage($errorCode), 400);
        }

        $file = $_FILES['imagen'];

        // Validar tipo MIME real o por fallback
        $mimeType = null;
        if (class_exists('finfo')) {
            $finfo    = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($file['tmp_name']);
        } elseif (function_exists('mime_content_type')) {
            $mimeType = mime_content_type($file['tmp_name']);
        } else {
            $mimeType = $file['type'] ?? '';
        }

        if (!in_array($mimeType, self::ALLOWED_TYPES, true)) {
            Response::error('Tipo de imagen no permitido (' . ($mimeType ?: 'desconocido') . '). Use JPG, PNG o WebP.', 415);
        }

        // Validar tamaño
        if ($file['size'] > self::MAX_SIZE_BYTES) {
            Response::error('La imagen no puede superar 5 MB.', 413);
        }

        // Subir a Cloudinary
        $cloudinary = CloudinaryConfig::getInstance();

        $cloudName    = $_ENV['CLOUDINARY_CLOUD_NAME'] ?? 'default';
        $folder       = "assets/tiendaintima-images/productos/{$productoId}";
        $esPrincipal  = filter_var($_POST['es_principal'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $idVariante   = isset($_POST['id_variante']) && $_POST['id_variante'] !== ''
                        ? (int) $_POST['id_variante']
                        : null;

        $uploadResult = $cloudinary->upload($file['tmp_name'], $folder);

        // Guardar en BD
        $imagenId = $this->model->create([
            'id_producto'          => $productoId,
            'id_variante'          => $idVariante,
            'cloudinary_public_id' => $uploadResult['public_id'],
            'url'                  => $uploadResult['secure_url'],
            'es_principal'         => $esPrincipal,
            'orden'                => (int) ($_POST['orden'] ?? 0),
        ]);

        $imagen = $this->model->findById($imagenId);

        Response::created($imagen, "/api/imagenes/{$imagenId}");
    }

    /** Marca una imagen como la principal del producto */
    public function setPrincipal(array $params): void
    {
        $id    = (int) $params['id'];
        $image = $this->model->findById($id);

        if ($image === null) {
            throw new NotFoundException("Imagen #{$id} no encontrada.");
        }

        $this->model->setPrincipal($id, (int) $image['id_producto']);

        Response::success(['message' => 'Imagen marcada como principal.']);
    }

    /** Elimina la imagen de Cloudinary y de la BD */
    public function destroy(array $params): void
    {
        $id    = (int) $params['id'];
        $image = $this->model->findById($id);

        if ($image === null) {
            throw new NotFoundException("Imagen #{$id} no encontrada.");
        }

        // Eliminar de Cloudinary solo si tiene un public_id válido (no una URL de prueba o quemada)
        if (!empty($image['cloudinary_public_id']) && !str_starts_with($image['cloudinary_public_id'], 'http')) {
            try {
                $cloudinary = CloudinaryConfig::getInstance();
                $cloudinary->destroy($image['cloudinary_public_id']);
            } catch (\Throwable $e) {
                error_log("[Cloudinary] No se pudo eliminar {$image['cloudinary_public_id']}: " . $e->getMessage());
            }
        }

        $this->model->delete($id);

        Response::noContent();
    }

    private function uploadErrorMessage(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamaño permitido.',
            UPLOAD_ERR_PARTIAL                        => 'La subida fue interrumpida.',
            UPLOAD_ERR_NO_FILE                        => 'No se recibió ningún archivo.',
            UPLOAD_ERR_NO_TMP_DIR                     => 'Directorio temporal no disponible.',
            UPLOAD_ERR_CANT_WRITE                     => 'No se pudo guardar el archivo.',
            default                                   => 'Error desconocido al subir el archivo.',
        };
    }
}
