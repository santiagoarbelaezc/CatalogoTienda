<?php

declare(strict_types=1);

namespace App\Config;

use CURLFile;
use RuntimeException;

/**
 * Cliente nativo cURL para Cloudinary sin dependencias de SDK externas.
 * Evita errores de deprecación en PHP 8.4+ y realiza subidas ultra-rápidas con firma SHA-1.
 */
final class CloudinaryConfig
{
    private string $cloudName;
    private string $apiKey;
    private string $apiSecret;

    private static ?self $instance = null;

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        $this->cloudName = $_ENV['CLOUDINARY_CLOUD_NAME'] ?? '';
        $this->apiKey    = $_ENV['CLOUDINARY_API_KEY']    ?? '';
        $this->apiSecret = $_ENV['CLOUDINARY_API_SECRET'] ?? '';
    }

    /**
     * Sube un archivo a Cloudinary utilizando cURL y firma SHA-1.
     */
    public function upload(string $filePath, string $folder): array
    {
        if (empty($this->cloudName) || empty($this->apiKey) || empty($this->apiSecret)) {
            throw new RuntimeException("Credenciales de Cloudinary no configuradas en el entorno.");
        }

        $timestamp = (string) time();

        // Parámetros a firmar (orden alfabético estricto)
        $paramsToSign = [
            'folder'    => $folder,
            'timestamp' => $timestamp,
        ];
        ksort($paramsToSign);
        $paramString = http_build_query($paramsToSign);
        $paramString = str_replace(['+', '%7E'], [' ', '~'], $paramString);
        $paramString = urldecode($paramString);

        $signature = sha1($paramString . $this->apiSecret);

        $postData = [
            'file'      => new CURLFile($filePath),
            'api_key'   => $this->apiKey,
            'timestamp' => $timestamp,
            'folder'    => $folder,
            'signature' => $signature,
        ];

        $url = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/upload";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err      = curl_error($ch);

        if ($httpCode !== 200 || !$response) {
            throw new RuntimeException("Error subiendo a Cloudinary: " . ($err ?: "HTTP {$httpCode} - {$response}"));
        }

        $result = json_decode($response, true);
        if (!isset($result['secure_url'])) {
            throw new RuntimeException("Respuesta inválida de Cloudinary: " . $response);
        }

        return [
            'public_id'  => $result['public_id'],
            'secure_url' => $result['secure_url'],
        ];
    }

    /**
     * Elimina una imagen de Cloudinary por su public_id utilizando cURL.
     */
    public function destroy(string $publicId): bool
    {
        if (empty($this->cloudName) || empty($this->apiKey) || empty($this->apiSecret)) {
            return false;
        }

        $timestamp = (string) time();

        $paramsToSign = [
            'public_id' => $publicId,
            'timestamp' => $timestamp,
        ];
        ksort($paramsToSign);
        $paramString = http_build_query($paramsToSign);
        $paramString = str_replace(['+', '%7E'], [' ', '~'], $paramString);
        $paramString = urldecode($paramString);
        $signature   = sha1($paramString . $this->apiSecret);

        $postData = [
            'public_id' => $publicId,
            'api_key'   => $this->apiKey,
            'timestamp' => $timestamp,
            'signature' => $signature,
        ];

        $url = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/destroy";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);

        curl_exec($ch);

        return true;
    }
}
