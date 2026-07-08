<?php

declare(strict_types=1);

namespace App\Routes;

use App\Exceptions\NotFoundException;
use App\Utils\Response;

/**
 * Router HTTP ligero con soporte para:
 *  - Métodos GET, POST, PUT, PATCH, DELETE
 *  - Parámetros de ruta ({id}, {slug}, etc.)
 *  - Middleware chainable por ruta o grupo
 *  - Grupos de rutas con prefijo y middleware compartido
 */
final class Router
{
    /** @var array<array{method: string, pattern: string, handler: callable, middleware: callable[]}> */
    private array $routes = [];

    /** @var callable[] Middleware global (se aplica a todas las rutas) */
    private array $globalMiddleware = [];

    /** @var callable[] Middleware del grupo activo */
    private array $groupMiddleware = [];

    /** @var string Prefijo del grupo activo */
    private string $groupPrefix = '';

    // ── Registro de rutas ─────────────────────────────────────────────

    public function get(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('GET', $path, $handler, $middleware);
    }

    public function post(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('POST', $path, $handler, $middleware);
    }

    public function put(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('PUT', $path, $handler, $middleware);
    }

    public function patch(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('PATCH', $path, $handler, $middleware);
    }

    public function delete(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('DELETE', $path, $handler, $middleware);
    }

    /**
     * Agrupa rutas con prefijo y middleware compartido.
     *
     * @param callable $callback function(Router $router): void
     */
    public function group(string $prefix, callable $callback, array $middleware = []): void
    {
        $previousPrefix     = $this->groupPrefix;
        $previousMiddleware = $this->groupMiddleware;

        $this->groupPrefix     = $previousPrefix . $prefix;
        $this->groupMiddleware = array_merge($previousMiddleware, $middleware);

        $callback($this);

        $this->groupPrefix     = $previousPrefix;
        $this->groupMiddleware = $previousMiddleware;
    }

    private function addRoute(string $method, string $path, callable $handler, array $middleware): void
    {
        $fullPath   = $this->groupPrefix . $path;
        $pattern    = $this->compilePath($fullPath);
        $allMiddles = array_merge($this->globalMiddleware, $this->groupMiddleware, $middleware);

        $this->routes[] = [
            'method'     => strtoupper($method),
            'pattern'    => $pattern,
            'handler'    => $handler,
            'middleware' => $allMiddles,
        ];
    }

    // ── Despacho ──────────────────────────────────────────────────────

    public function dispatch(string $method, string $uri): void
    {
        $method = strtoupper($method);

        // Soporte para _method override (formularios HTML)
        if ($method === 'POST' && isset($_POST['_method'])) {
            $method = strtoupper($_POST['_method']);
        }

        // Normalizar URI
        $uri = '/' . trim($uri, '/');

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['pattern'], $uri, $matches)) {
                // Extraer solo los named captures como parámetros
                $params = array_filter(
                    $matches,
                    fn($k) => !is_int($k),
                    ARRAY_FILTER_USE_KEY
                );

                $this->runMiddlewareChain($route['middleware'], $route['handler'], $params);
                return;
            }
        }

        // Comprobar si existe la ruta pero con diferente método
        $allowedMethods = $this->getAllowedMethods($uri);
        if ($allowedMethods) {
            header('Allow: ' . implode(', ', $allowedMethods));
            Response::error("Método {$method} no permitido para esta ruta.", 405);
            return;
        }

        throw new NotFoundException("Ruta '{$uri}' no encontrada.");
    }

    // ── Helpers ───────────────────────────────────────────────────────

    /**
     * Convierte un path con parámetros ({id}) a una regex named capture.
     * Ejemplo: /productos/{id} → #^/productos/(?P<id>[^/]+)$#
     */
    private function compilePath(string $path): string
    {
        $pattern = preg_replace('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', '(?P<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    /** @return string[] */
    private function getAllowedMethods(string $uri): array
    {
        $methods = [];

        foreach ($this->routes as $route) {
            if (preg_match($route['pattern'], $uri)) {
                $methods[] = $route['method'];
            }
        }

        return array_unique($methods);
    }

    /**
     * Ejecuta la cadena de middleware antes de llamar al handler.
     *
     * Cada middleware recibe (array $params, callable $next):void
     */
    private function runMiddlewareChain(array $middlewares, callable $handler, array $params): void
    {
        if (empty($middlewares)) {
            $handler($params);
            return;
        }

        $chain = array_reduce(
            array_reverse($middlewares),
            fn(callable $next, callable $middleware) => fn() => $middleware($params, $next),
            fn() => $handler($params)
        );

        $chain();
    }
}
