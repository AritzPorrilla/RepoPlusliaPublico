<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReadingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Device is authenticated via device-token guard; ownership check is implicit
        return true;
    }

    public function rules(): array
    {
        return [
            'recorded_at'  => ['required', 'date'],
            'produced_wh'  => ['required', 'integer', 'min:0'],
            'consumed_wh'  => ['required', 'integer', 'min:0'],
            'exported_wh'  => ['required', 'integer', 'min:0'],
            'imported_wh'  => ['required', 'integer', 'min:0'],
            'voltage_v'    => ['sometimes', 'numeric', 'between:190,260'],
            'frequency_hz' => ['sometimes', 'numeric', 'between:48,52'],
        ];
    }
}
