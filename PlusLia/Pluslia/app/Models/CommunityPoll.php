<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['community_id', 'created_by', 'title', 'description', 'type', 'status', 'closes_at'])]
class CommunityPoll extends Model
{
    protected $casts = [
        'closes_at' => 'datetime',
    ];

    public function community(): BelongsTo
    {
        return $this->belongsTo(EnergyCommunity::class, 'community_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function options(): HasMany
    {
        return $this->hasMany(PollOption::class, 'poll_id')->orderBy('position');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PollVote::class, 'poll_id');
    }

    public function isOpen(): bool
    {
        if ($this->status === 'closed') {
            return false;
        }

        return $this->closes_at === null || $this->closes_at->isFuture();
    }

    public function hasVoted(int $userId): bool
    {
        return $this->votes()->where('user_id', $userId)->exists();
    }
}
