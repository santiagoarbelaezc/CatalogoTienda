<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class Analytics extends BaseModel
{
    public function __construct(PDO $pdo)
    {
        parent::__construct($pdo);
        $this->ensureEventsTableExists();
    }

    /**
     * Crea la tabla analytics_events si aún no existe.
     */
    private function ensureEventsTableExists(): void
    {
        $sql = "CREATE TABLE IF NOT EXISTS analytics_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            producto_id INT NULL,
            variante_id INT NULL,
            event_type VARCHAR(50) NOT NULL DEFAULT 'whatsapp_quote',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_event_created (created_at),
            INDEX idx_event_prod (producto_id),
            INDEX idx_event_var (variante_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        
        try {
            $this->pdo->exec($sql);
        } catch (\Throwable $e) {
            // Silencioso si la tabla ya existe
        }
    }

    /**
     * Registra un nuevo evento de analítica (ej. clic en WhatsApp / Cotizar).
     */
    public function recordEvent(?int $productoId, ?int $varianteId, string $eventType = 'whatsapp_quote'): bool
    {
        $sql = "INSERT INTO analytics_events (producto_id, variante_id, event_type, created_at)
                VALUES (:producto_id, :variante_id, :event_type, NOW())";
        
        return $this->execute($sql, [
            'producto_id' => $productoId,
            'variante_id' => $varianteId,
            'event_type'  => $eventType
        ]) > 0;
    }

    /**
     * Retorna los KPIs principales calculados 100% con datos reales de la BD.
     */
    public function getKpis(): array
    {
        // 1. Estadísticas de productos (Totales y Activos)
        $prodStats = $this->fetchOne("
            SELECT 
                COUNT(*) as total_prod,
                SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as active_prod,
                AVG(precio_base) as avg_price
            FROM productos
        ") ?? [];
        $totalProd  = (int) ($prodStats['total_prod'] ?? 0);
        $activeProd = (int) ($prodStats['active_prod'] ?? 0);
        $avgPrice   = (float) ($prodStats['avg_price'] ?? 0);

        // 2. Estadísticas de variantes y valorización real del inventario
        $stockStats = $this->fetchOne("
            SELECT 
                COUNT(v.id) as total_variants,
                COALESCE(SUM(v.stock), 0) as total_stock,
                COALESCE(SUM(v.stock * COALESCE(NULLIF(v.precio, 0), p.precio_base, 0)), 0) as total_inventory_value,
                COALESCE(AVG(COALESCE(NULLIF(v.precio, 0), p.precio_base, 0)), 0) as avg_variant_price,
                SUM(CASE WHEN v.stock <= 5 THEN 1 ELSE 0 END) as low_stock_count
            FROM variantes v
            LEFT JOIN productos p ON p.id = v.id_producto
        ") ?? [];

        $totalVariants   = (int) ($stockStats['total_variants'] ?? 0);
        $totalStock      = (int) ($stockStats['total_stock'] ?? 0);
        $inventoryValue  = (float) ($stockStats['total_inventory_value'] ?? 0);
        $avgVariantPrice = (float) ($stockStats['avg_variant_price'] ?? $avgPrice);
        $lowStockCount   = (int) ($stockStats['low_stock_count'] ?? 0);

        // 3. Conteo de Categorías y Marcas
        $catCount   = (int) ($this->fetchOne("SELECT COUNT(*) as c FROM categorias")['c'] ?? 0);
        $brandCount = (int) ($this->fetchOne("SELECT COUNT(*) as c FROM marcas")['c'] ?? 0);

        // 4. Cotizaciones WhatsApp (Total y comparación últimos 7 días vs 7 días anteriores)
        $totalInquiries    = $this->count("SELECT COUNT(*) FROM analytics_events");
        $inquiriesThisWeek = $this->count("SELECT COUNT(*) FROM analytics_events WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        $inquiriesLastWeek = $this->count("SELECT COUNT(*) FROM analytics_events WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");

        $trend = 0.0;
        if ($inquiriesLastWeek > 0) {
            $trend = round((($inquiriesThisWeek - $inquiriesLastWeek) / $inquiriesLastWeek) * 100, 1);
        } else if ($inquiriesThisWeek > 0) {
            $trend = 100.0;
        }

        return [
            [
                'title'      => 'Total Productos en Catálogo',
                'value'      => (string) $totalProd,
                'icon'       => 'inventory_2',
                'trend'      => $totalProd > 0 ? round(($activeProd / max(1, $totalProd)) * 100, 1) : 0,
                'trendLabel' => "{$activeProd} activos en tienda",
                'raw'        => [
                    'total'      => $totalProd,
                    'activos'    => $activeProd,
                    'categorias' => $catCount,
                    'marcas'     => $brandCount
                ]
            ],
            [
                'title'      => 'Valorización del Inventario',
                'value'      => '$ ' . number_format($inventoryValue, 0, ',', '.'),
                'icon'       => 'paid',
                'trend'      => $totalVariants,
                'trendLabel' => "en {$totalVariants} variantes",
                'raw'        => [
                    'valor_total'   => $inventoryValue,
                    'promedio_item' => $avgVariantPrice
                ]
            ],
            [
                'title'      => 'Existencias Totales (Stock)',
                'value'      => number_format($totalStock, 0, ',', '.'),
                'icon'       => 'stacked_bar_chart',
                'trend'      => $lowStockCount > 0 ? -$lowStockCount : 0,
                'trendLabel' => $lowStockCount > 0 ? "{$lowStockCount} variantes bajo stock" : "Stock saludable",
                'raw'        => [
                    'stock_total' => $totalStock,
                    'bajo_stock'  => $lowStockCount
                ]
            ],
            [
                'title'      => 'Cotizaciones WhatsApp',
                'value'      => (string) $totalInquiries,
                'icon'       => 'chat',
                'trend'      => $trend,
                'trendLabel' => $inquiriesThisWeek > 0 ? "{$inquiriesThisWeek} esta semana" : "sin eventos recientes",
                'raw'        => [
                    'total'       => $totalInquiries,
                    'esta_semana' => $inquiriesThisWeek,
                    'semana_ant'  => $inquiriesLastWeek
                ]
            ]
        ];
    }

    /**
     * Distribución real de productos por categoría.
     */
    public function getCategoryDistribution(): array
    {
        $sql = "SELECT c.nombre as category_name, COUNT(p.id) as total_products
                FROM categorias c
                LEFT JOIN productos p ON p.id_categoria = c.id
                GROUP BY c.id, c.nombre
                ORDER BY total_products DESC, c.nombre ASC";
        
        $rows = $this->fetchAll($sql);
        
        $labels = [];
        $data   = [];

        foreach ($rows as $row) {
            $labels[] = $row['category_name'];
            $data[]   = (int) $row['total_products'];
        }

        return [
            'labels' => $labels,
            'data'   => $data
        ];
    }

    /**
     * Distribución real de productos por marca.
     */
    public function getBrandDistribution(): array
    {
        $sql = "SELECT m.nombre as brand_name, COUNT(p.id) as total_products
                FROM marcas m
                LEFT JOIN productos p ON p.id_marca = m.id
                GROUP BY m.id, m.nombre
                ORDER BY total_products DESC, m.nombre ASC";
        
        $rows = $this->fetchAll($sql);
        
        $labels = [];
        $data   = [];

        foreach ($rows as $row) {
            $labels[] = $row['brand_name'];
            $data[]   = (int) $row['total_products'];
        }

        return [
            'labels' => $labels,
            'data'   => $data
        ];
    }

    /**
     * Distribución real de productos por género.
     */
    public function getGenderDistribution(): array
    {
        $sql = "SELECT 
                    CASE 
                        WHEN genero = 'Femenino' THEN 'Femenino'
                        WHEN genero = 'Masculino' THEN 'Masculino'
                        WHEN genero = 'Unisex' THEN 'Unisex'
                        ELSE 'Sin Definir'
                    END as gender_name,
                    COUNT(*) as total_products
                FROM productos
                GROUP BY gender_name
                ORDER BY total_products DESC";
        
        $rows = $this->fetchAll($sql);
        
        $labels = [];
        $data   = [];

        foreach ($rows as $row) {
            $labels[] = $row['gender_name'];
            $data[]   = (int) $row['total_products'];
        }

        return [
            'labels' => $labels,
            'data'   => $data
        ];
    }

    /**
     * Cotizaciones reales agrupadas por los últimos 7 días continuos.
     */
    public function getQuotesByDay(): array
    {
        $daysEs = [
            'Mon' => 'Lun',
            'Tue' => 'Mar',
            'Wed' => 'Mié',
            'Thu' => 'Jue',
            'Fri' => 'Vie',
            'Sat' => 'Sáb',
            'Sun' => 'Dom'
        ];

        // Construir últimos 7 días
        $labels = [];
        $dateKeys = [];
        $data = [];

        for ($i = 6; $i >= 0; $i--) {
            $dt = new \DateTime("-{$i} days");
            $key = $dt->format('Y-m-d');
            $dayName = $daysEs[$dt->format('D')] ?? $dt->format('D');
            $dayNum = $dt->format('d');

            $labels[] = "{$dayName} {$dayNum}";
            $dateKeys[$key] = count($labels) - 1;
            $data[] = 0;
        }

        try {
            $sql = "SELECT DATE(created_at) as event_date, COUNT(*) as total
                    FROM analytics_events
                    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                    GROUP BY DATE(created_at)";
            $rows = $this->fetchAll($sql);
            
            foreach ($rows as $r) {
                $d = (string) $r['event_date'];
                if (isset($dateKeys[$d])) {
                    $idx = $dateKeys[$d];
                    $data[$idx] = (int) $r['total'];
                }
            }
        } catch (\Throwable $e) {
            // Mantiene el arreglo de ceros reales
        }

        return [
            'labels' => $labels,
            'data'   => $data
        ];
    }

    /**
     * Lista real de variantes más consultadas o con mayor actividad.
     */
    public function getTopVariants(int $limit = 8): array
    {
        $sql = "SELECT 
                    v.id as varianteId,
                    p.nombre as productoNombre,
                    v.sku,
                    COALESCE(c.hex, '#666666') as colorHex,
                    COALESCE(c.nombre, 'Único') as colorNombre,
                    COALESCE(t.nombre, 'Única') as talla,
                    v.stock,
                    COALESCE(NULLIF(v.precio, 0), p.precio_base, 0) as precio,
                    COUNT(ae.id) as inquiries
                FROM variantes v
                JOIN productos p ON p.id = v.id_producto
                LEFT JOIN colores c ON c.id = v.id_color
                LEFT JOIN tallas t ON t.id = v.id_talla
                LEFT JOIN analytics_events ae ON ae.variante_id = v.id
                GROUP BY v.id, p.nombre, v.sku, c.hex, c.nombre, t.nombre, v.stock, v.precio, p.precio_base
                ORDER BY inquiries DESC, v.stock DESC, p.id DESC
                LIMIT :limit";
        
        $rows = $this->fetchAll($sql, ['limit' => $limit]);
        
        $result = [];
        foreach ($rows as $row) {
            $inq = (int) ($row['inquiries'] ?? 0);

            $result[] = [
                'varianteId'     => (int) $row['varianteId'],
                'productoNombre' => $row['productoNombre'],
                'sku'            => $row['sku'],
                'colorHex'       => $row['colorHex'],
                'colorNombre'    => $row['colorNombre'],
                'talla'          => $row['talla'],
                'inquiries'      => $inq,
                'conversion'     => $inq > 0 ? "{$inq} cotizaciones" : "0 consultas",
                'stock'          => (int) $row['stock'],
                'precio'         => (float) $row['precio']
            ];
        }

        return $result;
    }

    /**
     * Resumen agregado de métricas de catálogo para reportes y dashboard.
     */
    public function getCatalogSummary(): array
    {
        $categories = $this->fetchAll("
            SELECT 
                c.id,
                c.nombre,
                COUNT(p.id) as total_productos,
                COALESCE(SUM(v.stock), 0) as total_stock,
                COALESCE(SUM(v.stock * COALESCE(NULLIF(v.precio, 0), p.precio_base, 0)), 0) as valor_inventario
            FROM categorias c
            LEFT JOIN productos p ON p.id_categoria = c.id
            LEFT JOIN variantes v ON v.id_producto = p.id
            GROUP BY c.id, c.nombre
            ORDER BY total_productos DESC, c.nombre ASC
        ");

        $brands = $this->fetchAll("
            SELECT 
                m.id,
                m.nombre,
                COUNT(p.id) as total_productos,
                COALESCE(SUM(v.stock), 0) as total_stock,
                COALESCE(SUM(v.stock * COALESCE(NULLIF(v.precio, 0), p.precio_base, 0)), 0) as valor_inventario
            FROM marcas m
            LEFT JOIN productos p ON p.id_marca = m.id
            LEFT JOIN variantes v ON v.id_producto = p.id
            GROUP BY m.id, m.nombre
            ORDER BY total_productos DESC, m.nombre ASC
        ");

        return [
            'categories' => $categories,
            'brands'     => $brands
        ];
    }
}
