# API REST — Catálogo Tienda Íntima

Backend PHP 8.1+ sin framework, conectado a MySQL (Hostinger) y Cloudinary.

---

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| PHP         | 8.1            |
| Composer    | 2.x            |
| MySQL       | 8.0            |
| PHP-ext     | pdo_mysql, fileinfo, json |

---

## Instalación local (primera vez)

```bash
# 1. Entrar al directorio
cd CatalogoTienda/backend-php

# 2. Instalar dependencias
composer install

# 3. Copiar el .env
cp .env.example .env
# Editar .env con tus credenciales reales

# 4. Obtener el cloud_name de Cloudinary
#    → https://cloudinary.com/console  (aparece arriba a la izquierda)
#    Pegarlo en .env → CLOUDINARY_CLOUD_NAME=xxxxx
```

---

## Ejecutar la base de datos

En **phpMyAdmin de Hostinger** (`https://auth-db1660.hstgr.io`):

1. Selecciona la BD `u941842000_tiendabd`
2. Pestaña **SQL**
3. Copia y ejecuta en orden:
   - `sql/01_schema.sql` → crea las 11 tablas
   - `sql/02_seed.sql`   → inserta datos de ejemplo
   - `sql/03_queries.sql`→ prueba las 5 queries

> ⚠️ Asegúrate de hacer **backup** desde phpMyAdmin antes.

---

## Servidor local con PHP built-in

```bash
# Desde el directorio backend-php
php -S localhost:8080 -t public
```

Prueba: `http://localhost:8080/health` → debe responder `{"success":true,"data":{"status":"ok"}}`

---

## Deploy en Hostinger

### Opción A — Backend en `/api/` del mismo dominio (recomendada)

```
Hostinger File Manager:
public_html/
└── api/
    ├── .htaccess      ← copiar desde backend-php/public/
    └── index.php      ← copiar desde backend-php/public/
```

El resto de archivos (`src/`, `vendor/`, `.env`, `composer.json`) van en un directorio **FUERA** de `public_html`, por ejemplo:

```
/home/u941842000/
├── catalogo-backend/   ← directorio privado (fuera de public_html)
│   ├── .env
│   ├── vendor/
│   ├── src/
│   └── composer.json
└── public_html/
    └── api/
        ├── .htaccess
        └── index.php
```

Actualizar la línea en `public/index.php`:
```php
define('BASE_PATH', '/home/u941842000/catalogo-backend');
```

### Opción B — Todo en `public_html/api/` (más simple, menos seguro)

Subir toda la carpeta `backend-php/` como `public_html/api/` y asegurarse de que `.env` esté bloqueado por `.htaccess` (ya configurado).

---

## Subir dependencias (Composer en Hostinger)

Hostinger permite SSH en planes Business/Cloud. Si tienes acceso:

```bash
ssh u941842000@tiendaintima.com
cd ~/catalogo-backend
composer install --no-dev --optimize-autoloader
```

Si no tienes SSH, ejecuta `composer install` local y sube la carpeta `vendor/` por FTP/SFTP.

---

## Endpoints de referencia rápida

### Públicos

```http
GET  /api/productos?categoria=12&marca=2&min_precio=50000&page=1&limit=20
GET  /api/productos/1
GET  /api/categorias?format=tree
GET  /api/marcas
GET  /api/telas
GET  /api/colores
GET  /api/tallas
```

### Admin (requieren: `Authorization: Bearer <token>`)

```http
POST   /api/auth/login
       Body: {"email": "admin@tiendaintima.com", "password": "Admin2024!"}

GET    /api/auth/me

POST   /api/admin/productos
PUT    /api/admin/productos/1
DELETE /api/admin/productos/1

POST   /api/admin/productos/1/imagenes   (multipart/form-data, campo: "imagen")
DELETE /api/admin/imagenes/1

POST   /api/admin/variantes
PUT    /api/admin/variantes/1
DELETE /api/admin/variantes/1
GET    /api/admin/variantes/low-stock?threshold=5
```

---

## Credenciales del admin por defecto

| Campo    | Valor                       |
|----------|-----------------------------|
| Email    | admin@tiendaintima.com      |
| Password | Admin2024!                  |

> 🔴 **Cambiar en producción** — el hash bcrypt en `02_seed.sql` corresponde a esta contraseña.

---

## Estructura del proyecto

```
backend-php/
├── public/             ← único directorio expuesto al web
│   ├── .htaccess
│   └── index.php
├── src/
│   ├── Config/         ← App, Database, Cloudinary, Cors
│   ├── Controllers/    ← Un controller por recurso
│   ├── Exceptions/     ← HttpException y derivadas
│   ├── Middleware/     ← AuthMiddleware (JWT)
│   ├── Models/         ← Repositorios PDO
│   ├── Routes/         ← Router + api.php
│   └── Utils/          ← Response, Validator, Pagination
├── sql/
│   ├── 01_schema.sql
│   ├── 02_seed.sql
│   └── 03_queries.sql
├── composer.json
├── .env                ← NO subir al git
└── .env.example
```

---

## Seguridad implementada

- ✅ Prepared statements PDO (anti SQL injection)
- ✅ JWT HS256 con expiración configurable
- ✅ Validación de MIME real en uploads (no confiar en extensión)
- ✅ Límite de tamaño de imagen (5 MB)
- ✅ Headers de seguridad en .htaccess (X-Frame-Options, X-Content-Type-Options)
- ✅ .env bloqueado por .htaccess
- ✅ Soft delete en productos (no se borran datos reales)
- ✅ CORS con lista blanca de orígenes
- ✅ Contraseñas con bcrypt (cost=12)
