<?php

declare(strict_types=1);

/**
 * Mapa completo de rutas REST — API Catálogo Tienda Íntima
 *
 * Convenciones:
 *  - Rutas públicas: sin middleware
 *  - Rutas admin:    con AuthMiddleware (Bearer JWT)
 *
 * @var \App\Routes\Router $router
 */

use App\Controllers\AnalyticsController;
use App\Controllers\AuthController;
use App\Controllers\CategoriaController;
use App\Controllers\ColorController;
use App\Controllers\ImagenController;
use App\Controllers\MarcaController;
use App\Controllers\ProductoController;
use App\Controllers\ProveedorController;
use App\Controllers\TallaController;
use App\Controllers\TelaController;
use App\Controllers\VarianteController;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;

$auth = new AuthMiddleware();

// ── Health-check ──────────────────────────────────────────────────────────────
$router->get('/', fn() => Response::success(['status' => 'ok', 'version' => '1.0.0']));
$router->get('/health', fn() => Response::success([
    'status' => 'ok',
    'timestamp' => date('c'),
    'php_version' => PHP_VERSION,
    'php_sapi' => PHP_SAPI,
    'php_ini' => php_ini_loaded_file(),
    'scanned_ini_files' => php_ini_scanned_files(),
    'extension_dir' => ini_get('extension_dir'),
    'has_php_d' => is_dir('/opt/alt/php83/etc/php.d'),
    'php_d_files' => is_dir('/opt/alt/php83/etc/php.d') ? scandir('/opt/alt/php83/etc/php.d') : [],
    'php_d_default_ini' => is_file('/opt/alt/php83/etc/php.d/default.ini') ? file_get_contents('/opt/alt/php83/etc/php.d/default.ini') : null,
    'php_d_pdo_mysql' => is_file('/opt/alt/php83/etc/php.d/pdo_mysql.ini') ? file_get_contents('/opt/alt/php83/etc/php.d/pdo_mysql.ini') : null,
    'has_php_d_all' => is_dir('/opt/alt/php83/etc/php.d.all'),
    'php_d_all_pdo' => is_file('/opt/alt/php83/etc/php.d.all/pdo.ini') ? file_get_contents('/opt/alt/php83/etc/php.d.all/pdo.ini') : null,
    'cl_selector' => is_dir('/home/' . get_current_user() . '/.cl.selector') ? scandir('/home/' . get_current_user() . '/.cl.selector') : [],
    'cl_defaults_cfg' => is_file('/home/' . get_current_user() . '/.cl.selector/defaults.cfg') ? file_get_contents('/home/' . get_current_user() . '/.cl.selector/defaults.cfg') : null,
    'pdo_loaded' => class_exists('PDO'),
    'pdo_drivers' => class_exists('PDO') ? \PDO::getAvailableDrivers() : [],
    'has_mysqli' => extension_loaded('mysqli'),
    'user' => get_current_user(),
    'doc_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? '',
    'loaded_extensions' => get_loaded_extensions(),
]));

// Event tracking público
$router->post('/analytics/events', fn() => (new AnalyticsController())->trackEvent());

// ══════════════════════════════════════════════════════════════════════════════
// Auth
// ══════════════════════════════════════════════════════════════════════════════
$router->post('/auth/login', fn() => (new AuthController())->login());
$router->get('/auth/me',     fn() => (new AuthController())->me(), [$auth]);

// ══════════════════════════════════════════════════════════════════════════════
// Catálogo — Rutas PÚBLICAS (lectura)
// ══════════════════════════════════════════════════════════════════════════════

// Productos
$router->get('/productos',      fn()        => (new ProductoController())->index());
$router->get('/productos/{id}', fn($params) => (new ProductoController())->show($params));
$router->post('/productos/ai-helper', fn()  => (new ProductoController())->aiHelper());

// Variantes públicas de un producto
$router->get('/productos/{id}/variantes', fn($p) => (new VarianteController())->indexByProducto($p));

// Catálogos de apoyo
$router->get('/categorias',      fn() => (new CategoriaController())->index());
$router->get('/categorias/{id}', fn($p) => (new CategoriaController())->show($p));
$router->get('/marcas',          fn() => (new MarcaController())->index());
$router->get('/marcas/{id}',     fn($p) => (new MarcaController())->show($p));
$router->get('/telas',           fn() => (new TelaController())->index());
$router->get('/telas/{id}',      fn($p) => (new TelaController())->show($p));
$router->get('/colores',         fn() => (new ColorController())->index());
$router->get('/colores/{id}',    fn($p) => (new ColorController())->show($p));
$router->get('/tallas',          fn() => (new TallaController())->index());
$router->get('/tallas/{id}',     fn($p) => (new TallaController())->show($p));

// ══════════════════════════════════════════════════════════════════════════════
// Admin — Rutas PROTEGIDAS (JWT requerido)
// ══════════════════════════════════════════════════════════════════════════════
$router->group('', function (\App\Routes\Router $r) use ($auth) {

    // ── Analíticas ──────────────────────────────────────────────────────────
    $r->get('/analytics/dashboard', fn() => (new AnalyticsController())->dashboard(), [$auth]);

    // ── Productos ──────────────────────────────────────────────────────────
    $r->post('/productos',      fn()  => (new ProductoController())->store(),         [$auth]);
    $r->put('/productos/{id}',  fn($p) => (new ProductoController())->update($p),     [$auth]);
    $r->delete('/productos/{id}', fn($p) => (new ProductoController())->destroy($p),  [$auth]);

    // ── Imágenes ───────────────────────────────────────────────────────────
    $r->post('/productos/{id}/imagenes',    fn($p) => (new ImagenController())->upload($p),       [$auth]);
    $r->put('/imagenes/{id}/principal',     fn($p) => (new ImagenController())->setPrincipal($p), [$auth]);
    $r->delete('/imagenes/{id}',            fn($p) => (new ImagenController())->destroy($p),      [$auth]);

    // ── Variantes ──────────────────────────────────────────────────────────
    $r->post('/variantes',       fn()  => (new VarianteController())->store(),          [$auth]);
    $r->put('/variantes/{id}',   fn($p) => (new VarianteController())->update($p),      [$auth]);
    $r->delete('/variantes/{id}', fn($p) => (new VarianteController())->destroy($p),   [$auth]);
    $r->get('/variantes/low-stock', fn() => (new VarianteController())->lowStock(),    [$auth]);

    // ── Categorías ────────────────────────────────────────────────────────
    $r->post('/categorias',       fn()  => (new CategoriaController())->store(),        [$auth]);
    $r->put('/categorias/{id}',   fn($p) => (new CategoriaController())->update($p),   [$auth]);
    $r->delete('/categorias/{id}', fn($p) => (new CategoriaController())->destroy($p), [$auth]);

    // ── Marcas ────────────────────────────────────────────────────────────
    $r->post('/marcas',       fn()  => (new MarcaController())->store(),        [$auth]);
    $r->put('/marcas/{id}',   fn($p) => (new MarcaController())->update($p),   [$auth]);
    $r->delete('/marcas/{id}', fn($p) => (new MarcaController())->destroy($p), [$auth]);

    // ── Telas ─────────────────────────────────────────────────────────────
    $r->post('/telas',       fn()  => (new TelaController())->store(),        [$auth]);
    $r->put('/telas/{id}',   fn($p) => (new TelaController())->update($p),   [$auth]);
    $r->delete('/telas/{id}', fn($p) => (new TelaController())->destroy($p), [$auth]);

    // ── Colores ───────────────────────────────────────────────────────────
    $r->post('/colores',       fn()  => (new ColorController())->store(),        [$auth]);
    $r->put('/colores/{id}',   fn($p) => (new ColorController())->update($p),   [$auth]);
    $r->delete('/colores/{id}', fn($p) => (new ColorController())->destroy($p), [$auth]);

    // ── Tallas ────────────────────────────────────────────────────────────
    $r->post('/tallas',       fn()  => (new TallaController())->store(),        [$auth]);
    $r->put('/tallas/{id}',   fn($p) => (new TallaController())->update($p),   [$auth]);
    $r->delete('/tallas/{id}', fn($p) => (new TallaController())->destroy($p), [$auth]);

    // ── Proveedores ───────────────────────────────────────────────────────
    $r->get('/proveedores',       fn()  => (new ProveedorController())->index(),        [$auth]);
    $r->get('/proveedores/{id}',  fn($p) => (new ProveedorController())->show($p),     [$auth]);
    $r->post('/proveedores',      fn()  => (new ProveedorController())->store(),        [$auth]);
    $r->put('/proveedores/{id}',  fn($p) => (new ProveedorController())->update($p),   [$auth]);
    $r->delete('/proveedores/{id}', fn($p) => (new ProveedorController())->destroy($p), [$auth]);

    // Asociar / desasociar proveedor ↔ producto
    $r->post('/proveedores/{id}/productos/{productoId}',
        fn($p) => (new ProveedorController())->attachProducto($p), [$auth]);
    $r->delete('/proveedores/{id}/productos/{productoId}',
        fn($p) => (new ProveedorController())->detachProducto($p), [$auth]);

}, []);
