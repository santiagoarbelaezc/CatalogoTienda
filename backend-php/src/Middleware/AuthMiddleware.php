<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Config\Database;
use App\Exceptions\UnauthorizedException;
use App\Models\AdminUsuario;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

/**
 * Middleware JWT de autenticación para rutas de administración.
 *
 * Espera la cabecera:  Authorization: Bearer <token>
 *
 * Si el token es válido, inyecta el payload en $_REQUEST['auth_user'].
 * Si no, lanza UnauthorizedException (→ 401).
 */
final class AuthMiddleware
{
    public function __invoke(array $params, callable $next): void
    {
        $token = $this->extractBearerToken();

        if ($token === null) {
            throw new UnauthorizedException('Token de autenticación no proporcionado.');
        }

        try {
            $secret  = $_ENV['JWT_SECRET'] ?? '';
            $payload = JWT::decode($token, new Key($secret, 'HS256'));

            // Verificar que el usuario sigue activo en BD
            $user = AdminUsuario::findActiveById(
                Database::getInstance()->getConnection(),
                (int) $payload->sub
            );

            if ($user === null) {
                throw new UnauthorizedException('Usuario no encontrado o desactivado.');
            }

            // Exponemos el payload para los controllers
            $_REQUEST['auth_user'] = $payload;

        } catch (ExpiredException) {
            throw new UnauthorizedException('El token ha expirado. Inicia sesión nuevamente.');
        } catch (SignatureInvalidException) {
            throw new UnauthorizedException('Firma del token inválida.');
        } catch (UnauthorizedException $e) {
            throw $e;
        } catch (\Throwable) {
            throw new UnauthorizedException('Token inválido o malformado.');
        }

        $next();
    }

    private function extractBearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
               ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
               ?? '';

        if ($header === '') {
            // Apache a veces no pasa Authorization; intentar con getallheaders()
            $headers = function_exists('getallheaders') ? getallheaders() : [];
            $header  = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        return null;
    }
}
