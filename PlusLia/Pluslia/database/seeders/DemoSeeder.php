<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Device;
use App\Models\EnergyCommunity;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $community = EnergyCommunity::factory()->create([
            'name' => 'Comunidad Solar Calle del Sol',
        ]);

        // 3 prosumidores
        $prosumers = User::factory(3)->prosumer()->create();
        foreach ($prosumers as $i => $user) {
            Address::factory()->prosumer(peakKwp: [4.0, 6.0, 8.0][$i])->create([
                'user_id' => $user->id,
            ]);
            Device::factory()->create(['user_id' => $user->id]);
            $community->members()->attach($user->id, [
                'sharing_coefficient' => round(1 / 5, 6),
                'status' => 'active',
            ]);
        }

        // 2 consumidores
        $consumers = User::factory(2)->consumer()->create();
        foreach ($consumers as $user) {
            Address::factory()->create(['user_id' => $user->id]);
            Device::factory()->create(['user_id' => $user->id]);
            $community->members()->attach($user->id, [
                'sharing_coefficient' => round(1 / 5, 6),
                'status' => 'active',
            ]);
        }

        $this->command->info('Generando 30 días de lecturas simuladas...');
        Artisan::call('plc:simulate', ['--backfill' => 30], $this->command->getOutput());
    }
}
