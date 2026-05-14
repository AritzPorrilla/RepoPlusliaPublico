<?php

use App\Models\DailyAggregate;
use App\Models\MonthlySettlement;
use App\Models\User;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['prosumer', 'consumer', 'admin'] as $role) {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
    }
});

it('generates a monthly settlement from daily aggregates', function () {
    Carbon::setTestNow('2026-05-01');

    $user = User::factory()->prosumer()->create();

    // Seed 3 days of aggregates for April
    foreach (['2026-04-01', '2026-04-02', '2026-04-03'] as $day) {
        DailyAggregate::create([
            'user_id' => $user->id,
            'day' => $day,
            'produced_kwh' => 10,
            'consumed_kwh' => 6,
            'surplus_kwh' => 4,
            'grid_exported_kwh' => 4,
            'grid_imported_kwh' => 0,
            'p2p_sold_kwh' => 0,
            'p2p_bought_kwh' => 0,
            'savings_eur' => 0,
        ]);
    }

    $this->artisan('settlement:generate')->assertSuccessful();

    $settlement = MonthlySettlement::where('user_id', $user->id)
        ->whereDate('month', '2026-04-01')
        ->first();

    expect($settlement)->not->toBeNull()
        ->and((float) $settlement->total_exported_kwh)->toBe(12.0)
        ->and((float) $settlement->total_imported_kwh)->toBe(0.0);
});

it('skips users with no aggregates for the month', function () {
    Carbon::setTestNow('2026-05-01');

    User::factory()->prosumer()->create(); // no aggregates

    $this->artisan('settlement:generate')->assertSuccessful();

    expect(MonthlySettlement::count())->toBe(0);
});

it('updates an existing settlement when re-run', function () {
    Carbon::setTestNow('2026-05-01');

    $user = User::factory()->prosumer()->create();

    DailyAggregate::create([
        'user_id' => $user->id,
        'day' => '2026-04-15',
        'produced_kwh' => 20,
        'consumed_kwh' => 10,
        'surplus_kwh' => 10,
        'grid_exported_kwh' => 10,
        'grid_imported_kwh' => 2,
        'p2p_sold_kwh' => 0,
        'p2p_bought_kwh' => 0,
        'savings_eur' => 0,
    ]);

    $this->artisan('settlement:generate')->assertSuccessful();
    $this->artisan('settlement:generate')->assertSuccessful();

    expect(MonthlySettlement::where('user_id', $user->id)->count())->toBe(1);
});
