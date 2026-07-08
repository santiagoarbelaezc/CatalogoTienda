<?php

declare(strict_types=1);

namespace App\Utils;

use App\Exceptions\ValidationException;

/**
 * Validador de datos de entrada.
 *
 * Uso:
 *   $v = new Validator($_POST);
 *   $v->required(['nombre', 'precio'])
 *     ->numeric(['precio', 'stock'])
 *     ->maxLength('nombre', 200)
 *     ->email('email');
 *
 *   if (!$v->passes()) {
 *       throw new ValidationException($v->errors());
 *   }
 *
 *   $data = $v->validated(); // Solo los campos validados
 */
final class Validator
{
    /** @var array<string, string[]> */
    private array $errors = [];

    /** @var array<string, mixed> */
    private array $validated = [];

    /** @param array<string, mixed> $data */
    public function __construct(private readonly array $data) {}

    // ── Reglas ────────────────────────────────────────────────────────

    /** @param string[] $fields */
    public function required(array $fields): self
    {
        foreach ($fields as $field) {
            $value = $this->data[$field] ?? null;

            if ($value === null || $value === '' || $value === []) {
                $this->addError($field, "El campo '{$field}' es obligatorio.");
            } else {
                $this->validated[$field] = $value;
            }
        }

        return $this;
    }

    /** @param string[] $fields */
    public function optional(array $fields): self
    {
        foreach ($fields as $field) {
            if (array_key_exists($field, $this->data)) {
                $this->validated[$field] = $this->data[$field];
            }
        }

        return $this;
    }

    /** @param string[] $fields */
    public function numeric(array $fields): self
    {
        foreach ($fields as $field) {
            $value = $this->data[$field] ?? null;

            if ($value !== null && $value !== '' && !is_numeric($value)) {
                $this->addError($field, "El campo '{$field}' debe ser un número.");
            }
        }

        return $this;
    }

    /** @param string[] $fields */
    public function positiveNumeric(array $fields): self
    {
        foreach ($fields as $field) {
            $value = $this->data[$field] ?? null;

            if ($value !== null && $value !== '') {
                if (!is_numeric($value) || (float) $value < 0) {
                    $this->addError($field, "El campo '{$field}' no puede ser un valor negativo.");
                }
            }
        }

        return $this;
    }

    /** @param string[] $fields */
    public function positiveInt(array $fields): self
    {
        foreach ($fields as $field) {
            $value = $this->data[$field] ?? null;

            if ($value !== null && $value !== '') {
                $int = filter_var($value, FILTER_VALIDATE_INT);

                if ($int === false || $int < 0) {
                    $this->addError($field, "El campo '{$field}' debe ser un entero positivo.");
                }
            }
        }

        return $this;
    }

    public function maxLength(string $field, int $max): self
    {
        $value = $this->data[$field] ?? null;

        if ($value !== null && mb_strlen((string) $value) > $max) {
            $this->addError($field, "El campo '{$field}' no puede superar {$max} caracteres.");
        }

        return $this;
    }

    public function minLength(string $field, int $min): self
    {
        $value = $this->data[$field] ?? null;

        if ($value !== null && mb_strlen((string) $value) < $min) {
            $this->addError($field, "El campo '{$field}' debe tener al menos {$min} caracteres.");
        }

        return $this;
    }

    /** @param string[] $allowed */
    public function inList(string $field, array $allowed): self
    {
        $value = $this->data[$field] ?? null;

        if ($value !== null && !in_array($value, $allowed, true)) {
            $list = implode(', ', $allowed);
            $this->addError($field, "El campo '{$field}' debe ser uno de: {$list}.");
        }

        return $this;
    }

    public function email(string $field): self
    {
        $value = $this->data[$field] ?? null;

        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->addError($field, "El campo '{$field}' debe ser un email válido.");
        }

        return $this;
    }

    public function hexColor(string $field): self
    {
        $value = $this->data[$field] ?? null;

        if ($value !== null && $value !== '' && !preg_match('/^#[0-9A-Fa-f]{6}$/', (string) $value)) {
            $this->addError($field, "El campo '{$field}' debe ser un color HEX válido (#RRGGBB).");
        }

        return $this;
    }

    public function sku(string $field): self
    {
        $value = $this->data[$field] ?? null;

        if ($value !== null && $value !== '' && !preg_match('/^[A-Z0-9\-]{3,100}$/', (string) $value)) {
            $this->addError($field, "El campo '{$field}' solo permite mayúsculas, números y guiones (3-100 chars).");
        }

        return $this;
    }

    // ── Resultado ─────────────────────────────────────────────────────

    public function passes(): bool
    {
        return empty($this->errors);
    }

    public function fails(): bool
    {
        return !$this->passes();
    }

    /**
     * @return array<string, string[]>
     * @throws ValidationException
     */
    public function validateOrFail(): array
    {
        if ($this->fails()) {
            throw new ValidationException($this->errors);
        }

        return $this->validated;
    }

    /** @return array<string, string[]> */
    public function errors(): array
    {
        return $this->errors;
    }

    /** @return array<string, mixed> */
    public function validated(): array
    {
        return $this->validated;
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private function addError(string $field, string $message): void
    {
        $this->errors[$field][] = $message;
    }

    /**
     * Devuelve un valor del input sanitizado como string.
     */
    public static function sanitizeString(mixed $value): string
    {
        return trim(htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'));
    }
}
