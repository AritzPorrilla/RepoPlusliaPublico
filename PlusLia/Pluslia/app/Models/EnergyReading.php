<?php

namespace App\Models;

use Database\Factories\EnergyReadingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['device_id', 'recorded_at', 'produced_wh', 'consumed_wh', 'exported_wh', 'imported_wh', 'voltage_v', 'frequency_hz'])]
class EnergyReading extends Model
{
    /** @use HasFactory<EnergyReadingFactory> */
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'recorded_at' => 'datetime',
            'voltage_v' => 'decimal:2',
            'frequency_hz' => 'decimal:3',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
