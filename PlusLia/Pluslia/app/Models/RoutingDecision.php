<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['device_id', 'recorded_at', 'destination', 'price_applied', 'kwh'])]
class RoutingDecision extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'recorded_at' => 'datetime',
            'price_applied' => 'decimal:6',
            'kwh' => 'decimal:3',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
