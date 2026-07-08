<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\UnauthorizedException;
use App\Models\AdminUsuario;
use App\Utils\Response;
use App\Utils\Validator;
use Firebase\JWT\JWT;

/**
 * POST /auth/login
 * POST /auth/me (devuelve el usuario autenticado)
 */
final class AuthController extends BaseController
{
    public function login(): void
    {
        $body = $this->body();

        $v = new Validator($body);
        $v->required(['email', 'password'])
          ->email('email')
          ->minLength('password', 6);

        $validated = $v->validateOrFail();

        $model = new AdminUsuario($this->pdo);
        $user  = $model->findByEmail($validated['email']);

        if ($user === null || !password_verify($validated['password'], $user['password_hash'])) {
            throw new UnauthorizedException('Credenciales incorrectas.');
        }

        $ttl     = (int) ($_ENV['JWT_TTL_SECONDS'] ?? 3600);
        $now     = time();
        $secret  = $_ENV['JWT_SECRET'] ?? '';

        $payload = [
            'sub'   => $user['id'],
            'email' => $user['email'],
            'name'  => $user['nombre'],
            'iat'   => $now,
            'exp'   => $now + $ttl,
        ];

        $token = JWT::encode($payload, $secret, 'HS256');

        Response::success([
            'token'      => $token,
            'expires_in' => $ttl,
            'user' => [
                'id'    => $user['id'],
                'email' => $user['email'],
                'nombre'=> $user['nombre'],
            ],
        ]);
    }

    /** GET /auth/me — requiere JWT (middleware) */
    public function me(): void
    {
        $userId = $this->authUserId();
        $model  = new AdminUsuario($this->pdo);
        $user   = $model->findById($userId);

        if ($user === null) {
            throw new UnauthorizedException('Usuario no encontrado.');
        }

        Response::success($user);
    }
}
