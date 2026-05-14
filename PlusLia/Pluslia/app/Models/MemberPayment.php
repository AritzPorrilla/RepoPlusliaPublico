<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['fee_id', 'user_id', 'amount_eur', 'status', 'paid_at', 'period'])]
class MemberPayment extends Model
{
    protected $casts = [
        'paid_at' => 'datetime',
        'amount_eur' => 'decimal:2',
    ];

    public function fee(): BelongsTo
    {
        return $this->belongsTo(CommunityFee::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
