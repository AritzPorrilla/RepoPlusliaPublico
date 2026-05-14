<?php

namespace App\Rules;

use App\Services\CifVerificationService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class ValidNif implements ValidationRule
{
    /**
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $service = app(CifVerificationService::class);

        if (! $service->validateChecksum((string) $value)) {
            $fail('El :attribute no es válido. Comprueba el dígito de control.');
        }
    }
}
