<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['recorded_at', 'source', 'price_eur_kwh'])]
class PriceTick extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'recorded_at' => 'datetime',
            'price_eur_kwh' => 'decimal:6',
        ];
    }
}
