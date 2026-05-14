<?php

namespace App\Http\Requests;

use App\Rules\ValidCups;
use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'street' => ['required', 'string', 'max:255'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lon' => ['required', 'numeric', 'between:-180,180'],
            'cups' => ['required', 'string', new ValidCups],
            'user_type' => ['required', 'in:consumer,prosumer'],
            'tariff' => ['required', 'in:pvpc,libre'],
            'monthly_consumption_kwh' => ['required', 'numeric', 'min:1', 'max:50000'],
            'contracted_power_kw' => ['nullable', 'numeric', 'min:0.1', 'max:100'],
            'peak_power_kwp' => ['nullable', 'numeric', 'min:0'],
            'panel_orientation' => ['nullable', 'string', 'max:50'],
            'panel_inclination_deg' => ['nullable', 'numeric', 'between:0,90'],
        ];
    }

    /** @return array<string, string> */
    public function addressData(): array
    {
        return $this->only(['street', 'lat', 'lon', 'cups', 'peak_power_kwp', 'panel_orientation', 'panel_inclination_deg']);
    }
}
