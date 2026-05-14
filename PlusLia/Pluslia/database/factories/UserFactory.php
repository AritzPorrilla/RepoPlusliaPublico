<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'tariff' => '2.0TD',
            'contracted_power_kw' => fake()->randomElement([3.45, 4.6, 5.75, 6.9, 10.35]),
            'annual_consumption_kwh' => fake()->numberBetween(2000, 8000),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function prosumer(): static
    {
        return $this->state(fn (array $attributes) => [
            'annual_consumption_kwh' => fake()->numberBetween(3000, 7000),
        ])->afterCreating(function (User $user) {
            $user->assignRole('prosumer');
        });
    }

    public function consumer(): static
    {
        return $this->afterCreating(function (User $user) {
            $user->assignRole('consumer');
        });
    }

    public function admin(): static
    {
        return $this->afterCreating(function (User $user) {
            $user->assignRole('admin');
        });
    }

    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
