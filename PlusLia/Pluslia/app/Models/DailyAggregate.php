<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'day', 'produced_kwh', 'consumed_kwh', 'surplus_kwh', 'savings_eur', 'p2p_sold_kwh', 'p2p_bought_kwh', 'grid_exported_kwh', 'grid_imported_kwh'])]
class DailyAggregate extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'day' => 'date',
            'produced_kwh' => 'decimal:3',
            'consumed_kwh' => 'decimal:3',
            'surplus_kwh' => 'decimal:3',
            'savings_eur' => 'decimal:4',
            'p2p_sold_kwh' => 'decimal:3',
            'p2p_bought_kwh' => 'decimal:3',
            'grid_exported_kwh' => 'decimal:3',
            'grid_imported_kwh' => 'decimal:3',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
