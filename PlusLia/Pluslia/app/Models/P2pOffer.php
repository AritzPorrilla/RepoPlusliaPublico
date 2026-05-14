<?php

namespace App\Models;

use Database\Factories\P2pOfferFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['producer_id', 'price_eur_kwh', 'kwh_available', 'valid_until', 'status'])]
class P2pOffer extends Model
{
    /** @use HasFactory<P2pOfferFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'price_eur_kwh' => 'decimal:6',
            'kwh_available' => 'decimal:3',
            'valid_until' => 'datetime',
        ];
    }

    public function producer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'producer_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active')->where('valid_until', '>', now());
    }
}
