<?php

namespace App\Models;

use Database\Factories\AddressFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'street', 'lat', 'lon', 'cups', 'peak_power_kwp', 'panel_orientation', 'panel_inclination_deg'])]
class Address extends Model
{
    /** @use HasFactory<AddressFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:7',
            'lon' => 'decimal:7',
            'peak_power_kwp' => 'decimal:2',
            'panel_inclination_deg' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
