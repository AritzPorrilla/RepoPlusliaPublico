<?php

use App\Events\EnergyReadingRecorded;
use App\Listeners\UpdateDailyAggregateListener;
use App\Models\DailyAggregate;
use App\Models\Device;
use App\Models\EnergyReading;
use App\Models\User;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['prosumer', 'consumer', 'admin'] as $role) {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
    }
});

it('creates a daily aggregate row on first reading', function () {
    $user = User::factory()->prosumer()->create();
    $device = Device::factory()->for($user)->create();

    $reading = EnergyReading::factory()->for($device)->create([
        'recorded_at' => Carbon::parse('2026-05-01 10:00:00'),
        'produced_wh' => 2000,
        'consumed_wh' => 800,
        'exported_wh' => 1200,
        'imported_wh' => 0,
    ]);

    (new UpdateDailyAggregateListener)->handle(new EnergyReadingRecorded($reading));

    $agg = DailyAggregate::where('user_id', $user->id)->where('day', '2026-05-01')->first();

    expect($agg)->not->toBeNull()
        ->and((float) $agg->produced_kwh)->toBe(2.0)
        ->and((float) $agg->consumed_kwh)->toBe(0.8)
        ->and((float) $agg->grid_exported_kwh)->toBe(1.2)
        ->and((float) $agg->grid_imported_kwh)->toBe(0.0);
});

it('accumulates values on subsequent readings for the same day', function () {
    $user = User::factory()->prosumer()->create();
    $device = Device::factory()->for($user)->create();

    $listener = new UpdateDailyAggregateListener;

    $reading1 = EnergyReading::factory()->for($device)->create([
        'recorded_at' => Carbon::parse('2026-05-01 10:00:00'),
        'produced_wh' => 1000,
        'consumed_wh' => 400,
        'exported_wh' => 600,
        'imported_wh' => 0,
    ]);

    $reading2 = EnergyReading::factory()->for($device)->create([
        'recorded_at' => Carbon::parse('2026-05-01 10:15:00'),
        'produced_wh' => 1000,
        'consumed_wh' => 400,
        'exported_wh' => 600,
        'imported_wh' => 0,
    ]);

    $listener->handle(new EnergyReadingRecorded($reading1));
    $listener->handle(new EnergyReadingRecorded($reading2));

    $agg = DailyAggregate::where('user_id', $user->id)->where('day', '2026-05-01')->first();

    expect((float) $agg->produced_kwh)->toBe(2.0)
        ->and((float) $agg->grid_exported_kwh)->toBe(1.2);
});

it('keeps separate rows for different days', function () {
    $user = User::factory()->prosumer()->create();
    $device = Device::factory()->for($user)->create();

    $listener = new UpdateDailyAggregateListener;

    foreach (['2026-05-01', '2026-05-02'] as $day) {
        $reading = EnergyReading::factory()->for($device)->create([
            'recorded_at' => Carbon::parse("{$day} 10:00:00"),
            'produced_wh' => 1000,
            'consumed_wh' => 500,
            'exported_wh' => 500,
            'imported_wh' => 0,
        ]);
        $listener->handle(new EnergyReadingRecorded($reading));
    }

    expect(DailyAggregate::where('user_id', $user->id)->count())->toBe(2);
});
