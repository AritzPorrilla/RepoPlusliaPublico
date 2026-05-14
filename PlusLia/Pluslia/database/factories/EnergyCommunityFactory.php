<?php

namespace Database\Factories;

use App\Models\EnergyCommunity;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EnergyCommunity>
 */
class EnergyCommunityFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Comunidad '.fake('es_ES')->streetName(),
            'centroid_lat' => 40.4150,
            'centroid_lon' => -3.7000,
            'max_distance_m' => 5000,
            'sharing_policy' => 'proportional',
        ];
    }
}
