<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['community_id', 'user_id', 'roof_m2', 'monthly_kwh', 'interest_level', 'has_own_panels', 'notes'])]
class CommunityDiagnosis extends Model
{
    protected $casts = [
        'roof_m2' => 'decimal:2',
        'monthly_kwh' => 'decimal:2',
        'has_own_panels' => 'boolean',
    ];

    public function community(): BelongsTo
    {
        return $this->belongsTo(EnergyCommunity::class, 'community_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
