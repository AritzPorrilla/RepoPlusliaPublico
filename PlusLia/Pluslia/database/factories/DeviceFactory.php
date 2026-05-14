<?php

namespace Database\Factories;

use App\Models\Device;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Device>
 */
class DeviceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['inverter', 'smart_meter', 'plc', 'simulator']),
            'model' => fake()->randomElement(['Fronius Primo 5.0', 'Shelly 3EM', 'Victron MPPT 100/20', 'Carlo Gavazzi EM24']),
            'manufacturer' => fake()->randomElement(['Fronius', 'Shelly', 'Victron Energy', 'Carlo Gavazzi', null]),
            'serial_number' => fake()->optional()->bothify('??########'),
            'installation_date' => fake()->optional()->dateTimeBetween('-2 years', 'now'),
            'status' => fake()->randomElement(['active', 'active', 'active', 'inactive', 'maintenance']),
            'last_reading_at' => fake()->optional(0.7)->dateTimeBetween('-1 hour', 'now'),
            'api_token' => Str::random(80),
        ];
    }

    public function active(): static
    {
        return $this->state(['status' => 'active']);
    }

    public function inactive(): static
    {
        return $this->state(['status' => 'inactive']);
    }
}
