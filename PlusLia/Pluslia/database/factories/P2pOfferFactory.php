<?php

namespace Database\Factories;

use App\Models\P2pOffer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<P2pOffer>
 */
class P2pOfferFactory extends Factory
{
    public function definition(): array
    {
        return [
            'price_eur_kwh' => fake()->randomFloat(6, 0.08, 0.14),
            'kwh_available' => fake()->randomFloat(3, 0.5, 5.0),
            'valid_until' => now()->addMinutes(30),
            'status' => 'active',
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'valid_until' => now()->subHour(),
            'status' => 'expired',
        ]);
    }
}
