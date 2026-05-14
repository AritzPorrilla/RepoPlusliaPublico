<?php

use App\Console\Commands\GenerateMonthlySettlement;
use App\Models\DailyAggregate;
use App\Models\MonthlySettlement;
use App\Models\PriceTick;
use App\Models\User;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['prosumer', 'consumer', 'admin'] as $role) {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
    }

    Carbon::setTestNow('2026-05-01');
});

afterEach(fn () => Carbon::setTestNow(null));

it('records excedente_perdido_eur when export compensation exceeds import cost', function () {
    PriceTick::create(['source' => 'pvpc', 'recorded_at' => '2026-04-15', 'price_eur_kwh' => 0.10]);

    $user = User::factory()->prosumer()->create();

    // Exported 500 kWh, imported only 10 kWh → compensation 50 €, import cost 1 € → excess 49 €
    DailyAggregate::create([
        'user_id' => $user->id,
        'day' => '2026-04-10',
        'produced_kwh' => 600,
        'consumed_kwh' => 50,
        'surplus_kwh' => 500,
        'grid_exported_kwh' => 500,
        'grid_imported_kwh' => 10,
    ]);

    $this->artisan(GenerateMonthlySettlement::class, ['--month' => '2026-04'])
        ->assertSuccessful();

    $settlement = MonthlySettlement::whereDate('month', '2026-04-01')
        ->where('user_id', $user->id)
        ->firstOrFail();

    expect((float) $settlement->excedente_perdido_eur)->toBe(49.0);
});

it('does not record excedente_perdido_eur when import cost covers export compensation', function () {
    PriceTick::create(['source' => 'pvpc', 'recorded_at' => '2026-04-15', 'price_eur_kwh' => 0.10]);

    $user = User::factory()->prosumer()->create();

    // Exported 50 kWh, imported 100 kWh → compensation 5 €, import cost 10 € → no excess
    DailyAggregate::create([
        'user_id' => $user->id,
        'day' => '2026-04-10',
        'produced_kwh' => 100,
        'consumed_kwh' => 150,
        'surplus_kwh' => 50,
        'grid_exported_kwh' => 50,
        'grid_imported_kwh' => 100,
    ]);

    $this->artisan(GenerateMonthlySettlement::class, ['--month' => '2026-04'])
        ->assertSuccessful();

    $settlement = MonthlySettlement::whereDate('month', '2026-04-01')
        ->where('user_id', $user->id)
        ->firstOrFail();

    expect((float) $settlement->excedente_perdido_eur)->toBe(0.0);
});

it('balance_eur is capped so export compensation never exceeds import cost', function () {
    PriceTick::create(['source' => 'pvpc', 'recorded_at' => '2026-04-15', 'price_eur_kwh' => 0.10]);

    $user = User::factory()->prosumer()->create();

    // 200 kWh exported, 100 kWh imported → compensation bruta 20 €, import cost 10 € → cap at 10 €
    DailyAggregate::create([
        'user_id' => $user->id,
        'day' => '2026-04-10',
        'produced_kwh' => 300,
        'consumed_kwh' => 100,
        'surplus_kwh' => 200,
        'grid_exported_kwh' => 200,
        'grid_imported_kwh' => 100,
    ]);

    $this->artisan(GenerateMonthlySettlement::class, ['--month' => '2026-04'])
        ->assertSuccessful();

    $settlement = MonthlySettlement::whereDate('month', '2026-04-01')
        ->where('user_id', $user->id)
        ->firstOrFail();

    // compensacionCap (10) - gridImportCost (10) = 0 balance
    expect((float) $settlement->balance_eur)->toBe(0.0);
});
