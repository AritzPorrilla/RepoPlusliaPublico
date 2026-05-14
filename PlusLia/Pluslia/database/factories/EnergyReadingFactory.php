<?php

namespace Database\Factories;

use App\Models\EnergyReading;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EnergyReading>
 */
class EnergyReadingFactory extends Factory
{
    public function definition(): array
    {
        $produced = fake()->numberBetween(0, 3000);
        $consumed = fake()->numberBetween(200, 2000);
        $exported = max(0, $produced - $consumed);
        $imported = max(0, $consumed - $produced);

        return [
            'recorded_at' => fake()->dateTimeBetween('-30 days', 'now'),
            'produced_wh' => $produced,
            'consumed_wh' => $consumed,
            'exported_wh' => $exported,
            'imported_wh' => $imported,
            'voltage_v' => fake()->randomFloat(2, 228, 235),
            'frequency_hz' => fake()->randomFloat(3, 49.9, 50.1),
        ];
    }

    public function atTime(\DateTimeInterface $time): static
    {
        return $this->state(fn (array $attributes) => [
            'recorded_at' => $time,
        ]);
    }
}
