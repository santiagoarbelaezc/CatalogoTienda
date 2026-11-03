#!/usr/bin/env bash
set -e
BACKEND_PATH="$1"
BASE_PATH="$2"
DB_NAME="$3"
DB_USER="$4"
DB_PASSWORD="$5"

echo "=== Configurando entorno remoto ==="
echo "Backend Path: $BACKEND_PATH"
echo "Base Path:    $BASE_PATH"

if [ -z "$BACKEND_PATH" ] || [ "$BACKEND_PATH" = "/" ] || [ -z "$BASE_PATH" ] || [ "$BASE_PATH" = "/" ]; then
  echo "::error::Rutas inválidas en remote-deploy.sh: BACKEND_PATH='$BACKEND_PATH', BASE_PATH='$BASE_PATH'"
  exit 1
fi

# 1. Configurar archivo .env en la carpeta privada si no existe
if [ ! -f "$BACKEND_PATH/.env" ]; then
  if [ -f "$BACKEND_PATH/.env.example" ]; then
    cp "$BACKEND_PATH/.env.example" "$BACKEND_PATH/.env"
  elif [ -f "$BASE_PATH/backend_php/.env" ]; then
    cp "$BASE_PATH/backend_php/.env" "$BACKEND_PATH/.env"
  elif [ -f "$BASE_PATH/backend-php/.env" ]; then
    cp "$BASE_PATH/backend-php/.env" "$BACKEND_PATH/.env"
  elif [ -f "$BASE_PATH/public_html/backend_php/.env" ]; then
    cp "$BASE_PATH/public_html/backend_php/.env" "$BACKEND_PATH/.env"
  elif [ -f "$BASE_PATH/public_html/api/.env" ]; then
    cp "$BASE_PATH/public_html/api/.env" "$BACKEND_PATH/.env"
  fi
fi

# Hostinger requiere localhost para conexiones internas de MySQL (evita error 504)
sed -i "s/^DB_HOST=.*/DB_HOST=localhost/" "$BACKEND_PATH/.env" 2>/dev/null || true

# Inyección de secretos de GitHub Actions si están definidos
if [ -n "$DB_NAME" ]; then
  sed -i "s/^DB_NAME=.*/DB_NAME=$DB_NAME/" "$BACKEND_PATH/.env" 2>/dev/null || true
fi
if [ -n "$DB_USER" ]; then
  sed -i "s/^DB_USER=.*/DB_USER=$DB_USER/" "$BACKEND_PATH/.env" 2>/dev/null || true
fi
if [ -n "$DB_PASSWORD" ]; then
  # Comillas dobles para evitar que caracteres como '#' rompan la lectura de vlucas/phpdotenv
  sed -i "s/^DB_PASS=.*/DB_PASS=\"$DB_PASSWORD\"/" "$BACKEND_PATH/.env" 2>/dev/null || true
fi
chmod 600 "$BACKEND_PATH/.env" 2>/dev/null || true

# 2. Generar el API Bridge en public_html/api y public_html/backend_php
for BRIDGE_DIR in "$BASE_PATH/public_html/api" "$BASE_PATH/public_html/backend_php"; do
  mkdir -p "$BRIDGE_DIR"
  # Limpiar código legado si existía en public_html
  rm -rf "$BRIDGE_DIR/vendor" "$BRIDGE_DIR/controllers" "$BRIDGE_DIR/config" \
         "$BRIDGE_DIR/middleware" "$BRIDGE_DIR/models" "$BRIDGE_DIR/helpers" \
         "$BRIDGE_DIR/database" "$BRIDGE_DIR/src" "$BRIDGE_DIR/.env" 2>/dev/null || true

  # Generar index.php puente
  cat << 'EOF_BRIDGE_INDEX' > "$BRIDGE_DIR/index.php"
<?php
declare(strict_types=1);
/**
 * API Bridge - Reenvío hacia el backend protegido fuera de public_html
 */
EOF_BRIDGE_INDEX
  echo "\$backendRoot = '$BACKEND_PATH';" >> "$BRIDGE_DIR/index.php"
  cat << 'EOF_BRIDGE_BODY' >> "$BRIDGE_DIR/index.php"
if (!file_exists($backendRoot . "/index.php")) {
    http_response_code(500);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode(["success" => false, "error" => "API Bridge: Backend principal no encontrado en carpeta protegida."]);
    exit;
}
require_once $backendRoot . "/index.php";
EOF_BRIDGE_BODY

  # Generar .htaccess puente
  PREFIX=$(basename "$BRIDGE_DIR")
  cat << EOF_BRIDGE_HTACCESS > "$BRIDGE_DIR/.htaccess"
Options -Indexes
RewriteEngine On
RewriteBase /$PREFIX/

# CORS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ index.php [QSA,L]

# Excepción para /config
RewriteRule ^config(/.*)?$ index.php [QSA,L]

# Enrutar todo al router index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php [QSA,L]
EOF_BRIDGE_HTACCESS

  chmod 755 "$BRIDGE_DIR"
  chmod 644 "$BRIDGE_DIR/index.php" "$BRIDGE_DIR/.htaccess"
  echo "[OK] API Bridge configurado en $BRIDGE_DIR"
done

# 3. Directorio de subidas y permisos
mkdir -p "$BACKEND_PATH/uploads"
chmod 775 "$BACKEND_PATH/uploads" 2>/dev/null || true
find "$BACKEND_PATH" -type d -exec chmod 755 {} + 2>/dev/null || true
find "$BACKEND_PATH" -type f -exec chmod 644 {} + 2>/dev/null || true
chmod 600 "$BACKEND_PATH/.env" 2>/dev/null || true

# 4. Migraciones automáticas por CLI (opcional si existe migrate.php)
if [ -f "$BACKEND_PATH/database/migrate.php" ]; then
  echo "Ejecutando migraciones de base de datos..."
  php "$BACKEND_PATH/database/migrate.php" || echo "[WARN] Migración CLI pendiente de revisión."
fi

echo "[OK] Despliegue de Backend y API Bridge finalizado exitosamente."

