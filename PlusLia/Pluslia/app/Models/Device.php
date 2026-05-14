<?php

namespace App\Models;

use Database\Factories\DeviceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'type', 'model', 'serial_number', 'manufacturer', 'installation_date', 'status', 'last_reading_at', 'api_token'])]
#[Hidden(['api_token'])]
class Device extends Model
{
    /** @use HasFactory<DeviceFactory> */
    use HasFactory;

    /** @var array<string, string> */
    protected $casts = [
        'installation_date' => 'date',
        'last_reading_at' => 'datetime',
    ];

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function needsMaintenance(): bool
    {
        return $this->status === 'maintenance';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function energyReadings(): HasMany
    {
        return $this->hasMany(EnergyReading::class);
    }

    public function routingDecisions(): HasMany
    {
        return $this->hasMany(RoutingDecision::class);
    }
}
