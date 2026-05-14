<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['community_id', 'created_by', 'assigned_to', 'title', 'description', 'type', 'status', 'scheduled_at', 'completed_at'])]
class MaintenanceTask extends Model
{
    protected $casts = [
        'scheduled_at' => 'date',
        'completed_at' => 'datetime',
    ];

    public function community(): BelongsTo
    {
        return $this->belongsTo(EnergyCommunity::class, 'community_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isDone(): bool
    {
        return $this->status === 'done';
    }
}
