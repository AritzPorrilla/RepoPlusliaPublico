<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidCups implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! preg_match('/^ES\d{16}[A-Z]{2}\d$/', (string) $value)) {
            $fail('El :attribute debe tener el formato ES + 16 dígitos + 2 letras + 1 dígito (ej. ES0021000000000000AB1).');
        }
    }
}
