#!/usr/bin/env bash
set -e
BACKEND_PATH="$1"
DOC_ROOT="$2"
DB_NAME="$3"
DB_USER="$4"
DB_PASSWORD="$5"

echo "=== Configurando entorno remoto ==="
echo "Backend Path: $BACKEND_PATH"
echo "Doc Root:     $DOC_ROOT"

if [ -z "$BACKEND_PATH" ] || [ "$BACKEND_PATH" = "/" ] || [ -z "$DOC_ROOT" ] || [ "$DOC_ROOT" = "/" ]; then
  echo "::error::Rutas inválidas en remote-deploy.sh: BACKEND_PATH='$BACKEND_PATH', DOC_ROOT='$DOC_ROOT'"
  exit 1
fi

mkdir -p "$BACKEND_PATH" "$DOC_ROOT"

# 1. Configurar archivo .env en la carpeta privada
if [ ! -f "$BACKEND_PATH/.env" ]; then
  if [ -f "$BACKEND_PATH/.env.example" ]; then
    cp "$BACKEND_PATH/.env.example" "$BACKEND_PATH/.env"
  elif [ -f "$DOC_ROOT/.env" ]; then
    cp "$DOC_ROOT/.env" "$BACKEND_PATH/.env"
  fi
fi

# Configuración segura de .env usando PHP CLI (inmune a caracteres especiales como '&', '#', comillas)
php -r '
$envFile = $argv[1];
$dbName  = $argv[2] ?? "";
$dbUser  = $argv[3] ?? "";
$dbPass  = $argv[4] ?? "";

if (!file_exists($envFile)) {
    touch($envFile);
}
$content = file_get_contents($envFile);

// Forzar DB_HOST=localhost para Hostinger (evita error 504)
if (preg_match("/^DB_HOST=.*/m", $content)) {
    $content = preg_replace("/^DB_HOST=.*/m", "DB_HOST=localhost", $content);
} else {
    $content .= "\nDB_HOST=localhost\n";
}

$vars = [];
if ($dbName !== "") $vars["DB_NAME"] = $dbName;
if ($dbUser !== "") $vars["DB_USER"] = $dbUser;
if ($dbPass !== "") $vars["DB_PASS"] = "\"" . addcslashes($dbPass, "\"\\$") . "\"";

foreach ($vars as $key => $val) {
    if (preg_match("/^" . $key . "=.*/m", $content)) {
        $content = preg_replace("/^" . $key . "=.*/m", $key . "=" . $val, $content);
    } else {
        $content .= "\n" . $key . "=" . $val . "\n";
    }
}
file_put_contents($envFile, $content);
echo "[OK] Variables de entorno configuradas exitosamente en $envFile\n";
' "$BACKEND_PATH/.env" "$DB_NAME" "$DB_USER" "$DB_PASSWORD"

chmod 600 "$BACKEND_PATH/.env" 2>/dev/null || true

# 2. Generar el API Bridge en DOC_ROOT/api y DOC_ROOT/backend_php
for BRIDGE_DIR in "$DOC_ROOT/api" "$DOC_ROOT/backend_php"; do
  mkdir -p "$BRIDGE_DIR"
  rm -rf "$BRIDGE_DIR/vendor" "$BRIDGE_DIR/controllers" "$BRIDGE_DIR/config" \
         "$BRIDGE_DIR/middleware" "$BRIDGE_DIR/models" "$BRIDGE_DIR/helpers" \
         "$BRIDGE_DIR/database" "$BRIDGE_DIR/src" "$BRIDGE_DIR/.env" 2>/dev/null || true

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

# 3. Directorio de subidas y permisos del backend
mkdir -p "$BACKEND_PATH/uploads"
chmod 775 "$BACKEND_PATH/uploads" 2>/dev/null || true
find "$BACKEND_PATH" -type d -exec chmod 755 {} + 2>/dev/null || true
find "$BACKEND_PATH" -type f -exec chmod 644 {} + 2>/dev/null || true
chmod 600 "$BACKEND_PATH/.env" 2>/dev/null || true

# 4. Asegurar permisos en el dominio y en public_html (elimina el 403 Forbidden de LiteSpeed)
chmod 755 "$(dirname "$DOC_ROOT")" 2>/dev/null || true
chmod 755 "$DOC_ROOT" 2>/dev/null || true
find "$DOC_ROOT" -type d -exec chmod 755 {} + 2>/dev/null || true
find "$DOC_ROOT" -type f -exec chmod 644 {} + 2>/dev/null || true

echo "[OK] Despliegue de Backend y API Bridge finalizado exitosamente."
