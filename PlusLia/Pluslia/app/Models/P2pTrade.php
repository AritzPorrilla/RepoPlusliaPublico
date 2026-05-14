<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['producer_id', 'consumer_id', 'kwh', 'price_eur_kwh', 'recorded_at'])]
class P2pTrade extends Model
{
    protected function casts(): array
    {
        return [
            'kwh' => 'decimal:3',
            'price_eur_kwh' => 'decimal:6',
            'recorded_at' => 'datetime',
        ];
    }

    public function producer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'producer_id');
    }

    public function consumer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }
}
