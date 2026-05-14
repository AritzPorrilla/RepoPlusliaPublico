<?php

namespace App\Models;

use Database\Factories\EnergyCommunityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['name', 'centroid_lat', 'centroid_lon', 'max_distance_m', 'sharing_policy', 'invite_code', 'nif', 'legal_type', 'description'])]
class EnergyCommunity extends Model
{
    /** @use HasFactory<EnergyCommunityFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (EnergyCommunity $community) {
            if (empty($community->invite_code)) {
                do {
                    $code = strtoupper(Str::random(8));
                } while (self::where('invite_code', $code)->exists());

                $community->invite_code = $code;
            }
        });
    }

    protected function casts(): array
    {
        return [
            'centroid_lat' => 'decimal:7',
            'centroid_lon' => 'decimal:7',
            'max_distance_m' => 'integer',
        ];
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'community_user', 'community_id', 'user_id')
            ->withPivot(['joined_at', 'sharing_coefficient', 'status', 'role']);
    }

    public function admins(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'community_user', 'community_id', 'user_id')
            ->wherePivot('role', 'admin');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(CommunityMessage::class, 'community_id');
    }

    public function polls(): HasMany
    {
        return $this->hasMany(CommunityPoll::class, 'community_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CommunityDocument::class, 'community_id');
    }

    public function maintenanceTasks(): HasMany
    {
        return $this->hasMany(MaintenanceTask::class, 'community_id');
    }

    public function fees(): HasMany
    {
        return $this->hasMany(CommunityFee::class, 'community_id');
    }

    public function diagnoses(): HasMany
    {
        return $this->hasMany(CommunityDiagnosis::class, 'community_id');
    }
}
