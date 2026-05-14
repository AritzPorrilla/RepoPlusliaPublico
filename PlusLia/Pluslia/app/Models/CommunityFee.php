<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['community_id', 'title', 'description', 'amount_eur', 'frequency', 'active'])]
class CommunityFee extends Model
{
    protected $casts = [
        'active' => 'boolean',
        'amount_eur' => 'decimal:2',
    ];

    public function community(): BelongsTo
    {
        return $this->belongsTo(EnergyCommunity::class, 'community_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(MemberPayment::class, 'fee_id');
    }

    public function frequencyLabel(): string
    {
        return match ($this->frequency) {
            'monthly' => 'Mensual',
            'annual' => 'Anual',
            default => 'Única',
        };
    }
}
