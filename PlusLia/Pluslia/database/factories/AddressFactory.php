<?php

namespace Database\Factories;

use App\Models\Address;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    // Madrid centre bounding box — keeps all demo nodes within realistic P2P distance
    private const LAT_MIN = 40.400;
    private const LAT_MAX = 40.430;
    private const LON_MIN = -3.720;
    private const LON_MAX = -3.680;

    public function definition(): array
    {
        $cupsBody = fake()->numerify('################');
        $cups = 'ES'.$cupsBody.'JN0F';

        return [
            'street' => fake('es_ES')->streetAddress(),
            'lat' => fake()->randomFloat(7, self::LAT_MIN, self::LAT_MAX),
            'lon' => fake()->randomFloat(7, self::LON_MIN, self::LON_MAX),
            'cups' => $cups,
            'peak_power_kwp' => null,
            'panel_orientation' => null,
            'panel_inclination_deg' => null,
        ];
    }

    public function prosumer(float $peakKwp = 4.0): static
    {
        return $this->state(fn (array $attributes) => [
            'peak_power_kwp' => $peakKwp,
            'panel_orientation' => 'S',
            'panel_inclination_deg' => 30,
        ]);
    }
}
