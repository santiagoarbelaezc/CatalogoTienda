<?php

declare(strict_types=1);

namespace App\Utils;

/**
 * Utilidad de paginación por offset.
 *
 * Uso en Controller:
 *   $pagination = Pagination::fromRequest($_GET);
 *   $items = $model->findAll($pagination->limit, $pagination->offset, ...);
 *   $total = $model->count(...);
 *   Response::success($items, 200, $pagination->meta($total));
 */
final class Pagination
{
    public readonly int $page;
    public readonly int $limit;
    public readonly int $offset;

    private function __construct(int $page, int $limit)
    {
        $this->page   = max(1, $page);
        $this->limit  = min(max(1, $limit), 100); // máximo 100 por página
        $this->offset = ($this->page - 1) * $this->limit;
    }

    /**
     * Crea una instancia desde los query params.
     *
     * @param array<string, mixed> $query  Normalmente $_GET
     */
    public static function fromRequest(array $query, int $defaultLimit = 20): self
    {
        $page  = (int) ($query['page']  ?? 1);
        $limit = (int) ($query['limit'] ?? $defaultLimit);

        return new self($page, $limit);
    }

    /**
     * Genera el objeto `meta` para incluir en la respuesta JSON.
     *
     * @return array{page: int, limit: int, total: int, total_pages: int, has_next: bool, has_prev: bool}
     */
    public function meta(int $total): array
    {
        $totalPages = (int) ceil($total / $this->limit);

        return [
            'page'        => $this->page,
            'limit'       => $this->limit,
            'total'       => $total,
            'total_pages' => $totalPages,
            'has_next'    => $this->page < $totalPages,
            'has_prev'    => $this->page > 1,
        ];
    }
}
