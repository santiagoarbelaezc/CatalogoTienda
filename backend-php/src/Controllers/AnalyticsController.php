<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Analytics;
use App\Utils\Response;

class AnalyticsController extends BaseController
{
    private readonly Analytics $analyticsModel;

    public function __construct()
    {
        parent::__construct();
        $this->analyticsModel = new Analytics($this->pdo);
    }

    /**
     * GET /api/analytics/dashboard
     * Retorna todas las métricas agregadas para el dashboard de administración.
     */
    public function dashboard(): void
    {
        $kpis                 = $this->analyticsModel->getKpis();
        $categoryDistribution = $this->analyticsModel->getCategoryDistribution();
        $quotesByDay          = $this->analyticsModel->getQuotesByDay();
        $topVariants          = $this->analyticsModel->getTopVariants(6);

        Response::success([
            'kpis'                 => $kpis,
            'categoryDistribution' => $categoryDistribution,
            'quotesByDay'          => $quotesByDay,
            'topVariants'          => $topVariants
        ], 'Métricas del dashboard obtenidas exitosamente.');
    }

    /**
     * POST /api/analytics/events
     * Registra eventos de interacción (clics en WhatsApp, cotizaciones).
     */
    public function trackEvent(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $productoId = isset($input['producto_id']) ? (int) $input['producto_id'] : null;
        $varianteId = isset($input['variante_id']) ? (int) $input['variante_id'] : null;
        $eventType  = isset($input['event_type'])  ? (string) $input['event_type'] : 'whatsapp_quote';

        $saved = $this->analyticsModel->recordEvent($productoId, $varianteId, $eventType);

        if ($saved) {
            Response::success(['tracked' => true], 'Evento de analítica registrado.');
        } else {
            Response::error('No se pudo registrar el evento de analítica.', 400);
        }
    }
}
