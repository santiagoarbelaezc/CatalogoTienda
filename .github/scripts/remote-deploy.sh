#!/usr/bin/env bash
set -e
API_DIR="$1"
DOC_ROOT="$2"
DB_NAME="$3"
DB_USER="$4"
DB_PASSWORD="$5"

echo "=== Configurando entorno remoto (Backend en public_html/api) ==="
echo "API Dir:   $API_DIR"
echo "Doc Root:  $DOC_ROOT"

if [ -z "$API_DIR" ] || [ "$API_DIR" = "/" ] || [ -z "$DOC_ROOT" ] || [ "$DOC_ROOT" = "/" ]; then
  echo "::error::Rutas inválidas en remote-deploy.sh: API_DIR='$API_DIR', DOC_ROOT='$DOC_ROOT'"
  exit 1
fi

mkdir -p "$API_DIR" "$DOC_ROOT"

# 1. Configurar archivo .env en public_html/api/
if [ ! -f "$API_DIR/.env" ]; then
  if [ -f "$HOME/domains/tiendaintima.com/backend-catalogo/.env" ]; then
    cp "$HOME/domains/tiendaintima.com/backend-catalogo/.env" "$API_DIR/.env"
  elif [ -f "$HOME/domains/catalogo.tiendaintima.com/backend_php/.env" ]; then
    cp "$HOME/domains/catalogo.tiendaintima.com/backend_php/.env" "$API_DIR/.env"
  elif [ -f "$HOME/backend_php/.env" ]; then
    cp "$HOME/backend_php/.env" "$API_DIR/.env"
  elif [ -f "$API_DIR/.env.example" ]; then
    cp "$API_DIR/.env.example" "$API_DIR/.env"
  fi
fi

ENV_FILE="$API_DIR/.env"
touch "$ENV_FILE"

set_env_var() {
  local key="$1"
  local val="$2"
  grep -v "^${key}=" "$ENV_FILE" > "${ENV_FILE}.tmp" 2>/dev/null || true
  printf '%s=%s\n' "$key" "$val" >> "${ENV_FILE}.tmp"
  mv "${ENV_FILE}.tmp" "$ENV_FILE"
}

set_env_var "DB_HOST" "localhost"

if [ -n "$DB_NAME" ]; then
  set_env_var "DB_NAME" "$DB_NAME"
fi
if [ -n "$DB_USER" ]; then
  set_env_var "DB_USER" "$DB_USER"
fi
if [ -n "$DB_PASSWORD" ]; then
  set_env_var "DB_PASS" "\"$DB_PASSWORD\""
fi

echo "[OK] Variables de entorno configuradas exitosamente en $ENV_FILE"
chmod 600 "$ENV_FILE" 2>/dev/null || true

# 2. Configurar .htaccess blindado en public_html/api
cat << 'EOF_API_HTACCESS' > "$API_DIR/.htaccess"
# ============================================================
# Protección Integral de API Backend (public_html/api)
# Solo permite el flujo de la API a través de index.php
# ============================================================

Options -Indexes -MultiViews
DirectoryIndex index.php

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /api/

  # 1. Bloqueo estricto de directorios internos sensibles
  RewriteRule ^(src|vendor|database|config|controllers|middleware|models|helpers|tests|logs)(/.*)?$ - [F,L,NC]

  # 2. Bloqueo estricto de archivos de configuración y metadatos
  RewriteRule (^|/)(\.env.*|\.git.*|composer\.(json|lock)|package(-lock)?\.json|\.md|\.sql|\.log|\.ya?ml)$ - [F,L,NC]

  # 3. Preservar cabecera Authorization (imprescindible para tokens JWT)
  RewriteCond %{HTTP:Authorization} ^(.*)
  RewriteRule .* - [E=HTTP_AUTHORIZATION:%1]

  # 4. Manejo de peticiones CORS preflight (OPTIONS)
  RewriteCond %{REQUEST_METHOD} OPTIONS
  RewriteRule ^(.*)$ index.php [QSA,L]

  # 5. Enrutar todas las llamadas de la API a index.php
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

# Bloqueo adicional por FilesMatch
<FilesMatch "(^\.|\.env|composer\.(json|lock)|package(-lock)?\.json|\.md|\.sql|\.log|\.ya?ml)$">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
  <IfModule !mod_authz_core.c>
    Order Allow,Deny
    Deny from all
  </IfModule>
</FilesMatch>
EOF_API_HTACCESS

# 3. Protección adicional interna para src/
if [ -d "$API_DIR/src" ]; then
  cat << 'EOF_SRC_HTACCESS' > "$API_DIR/src/.htaccess"
<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
  Order Allow,Deny
  Deny from all
</IfModule>
EOF_SRC_HTACCESS
fi

# 4. Crear php.ini y .user.ini para forzar carga de módulos PDO en LiteSpeed
for INI_DIR in "$DOC_ROOT" "$API_DIR"; do
  cat << 'EOF_INI' > "$INI_DIR/php.ini"
[PHP]
extension=/opt/alt/php83/usr/lib64/php/modules/pdo.so
extension=/opt/alt/php83/usr/lib64/php/modules/mysqlnd.so
extension=/opt/alt/php83/usr/lib64/php/modules/nd_pdo_mysql.so
extension=/opt/alt/php83/usr/lib64/php/modules/nd_mysqli.so
EOF_INI

  cat << 'EOF_USER_INI' > "$INI_DIR/.user.ini"
[PHP]
extension=/opt/alt/php83/usr/lib64/php/modules/pdo.so
extension=/opt/alt/php83/usr/lib64/php/modules/mysqlnd.so
extension=/opt/alt/php83/usr/lib64/php/modules/nd_pdo_mysql.so
extension=/opt/alt/php83/usr/lib64/php/modules/nd_mysqli.so
EOF_USER_INI

  chmod 644 "$INI_DIR/php.ini" "$INI_DIR/.user.ini" 2>/dev/null || true
done

# 5. Permisos estrictos de directorios y archivos
mkdir -p "$API_DIR/uploads"
chmod 775 "$API_DIR/uploads" 2>/dev/null || true

find "$API_DIR" -type d -exec chmod 755 {} + 2>/dev/null || true
find "$API_DIR" -type f -exec chmod 644 {} + 2>/dev/null || true
chmod 600 "$API_DIR/.env" 2>/dev/null || true

# 5. Permisos en public_html
chmod 755 "$DOC_ROOT" 2>/dev/null || true
if [ -f "$DOC_ROOT/.htaccess" ]; then
  chmod 644 "$DOC_ROOT/.htaccess" 2>/dev/null || true
fi

# 6. Reiniciar procesos cacheados de LiteSpeed PHP
echo "Reiniciando procesos LSPHP del usuario..."
killall -9 lsphp 2>/dev/null || pkill -9 -u "$USER" lsphp 2>/dev/null || true

echo "[OK] Despliegue de Backend en public_html/api finalizado exitosamente."
