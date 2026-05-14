<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'tariff', 'contracted_power_kw', 'annual_consumption_kwh', 'user_type'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at'   => 'datetime',
            'password'            => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'contracted_power_kw' => 'decimal:2',
            'annual_consumption_kwh' => 'decimal:2',
        ];
    }

    public function address(): HasOne
    {
        return $this->hasOne(Address::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }

    public function communities(): BelongsToMany
    {
        return $this->belongsToMany(EnergyCommunity::class, 'community_user', 'user_id', 'community_id')
            ->withPivot(['joined_at', 'sharing_coefficient', 'status', 'role']);
    }

    public function administeredCommunities(): BelongsToMany
    {
        return $this->belongsToMany(EnergyCommunity::class, 'community_user', 'user_id', 'community_id')
            ->wherePivot('role', 'admin');
    }

    public function isCommunityAdminOf(EnergyCommunity $community): bool
    {
        return $this->communities()
            ->wherePivot('community_id', $community->id)
            ->wherePivot('role', 'admin')
            ->exists();
    }

    public function p2pOffers(): HasMany
    {
        return $this->hasMany(P2pOffer::class, 'producer_id');
    }

    public function p2pSales(): HasMany
    {
        return $this->hasMany(P2pTrade::class, 'producer_id');
    }

    public function p2pPurchases(): HasMany
    {
        return $this->hasMany(P2pTrade::class, 'consumer_id');
    }

    public function monthlySettlements(): HasMany
    {
        return $this->hasMany(MonthlySettlement::class);
    }

    public function dailyAggregates(): HasMany
    {
        return $this->hasMany(DailyAggregate::class);
    }
}
