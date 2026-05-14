<?php

use App\Events\EnergyReadingRecorded;
use App\Listeners\RouteSurplusListener;
use App\Models\Address;
use App\Models\Device;
use App\Models\EnergyReading;
use App\Models\P2pOffer;
use App\Models\P2pTrade;
use App\Models\PriceTick;
use App\Models\RoutingDecision;
use App\Models\User;
use App\Services\SurplusRouter;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['prosumer', 'consumer', 'admin'] as $role) {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
    }

    PriceTick::create(['source' => 'pvpc', 'recorded_at' => now(), 'price_eur_kwh' => 0.12]);
});

it('creates a routing decision for surplus readings', function () {
    $user = User::factory()->prosumer()->create();
    $device = Device::factory()->for($user)->create();
    Address::factory()->prosumer(peakKwp: 5.0)->for($user)->create();

    $reading = EnergyReading::factory()->for($device)->create([
        'recorded_at' => Carbon::now(),
        'produced_wh' => 3000,
        'consumed_wh' => 800,
        'exported_wh' => 2200,
        'imported_wh' => 0,
    ]);

    (new RouteSurplusListener(new SurplusRouter))->handle(new EnergyReadingRecorded($reading));

    expect(RoutingDecision::where('device_id', $device->id)->count())->toBe(1);
});

it('skips routing when there is no surplus', function () {
    $user = User::factory()->consumer()->create();
    $device = Device::factory()->for($user)->create();
    Address::factory()->for($user)->create();

    $reading = EnergyReading::factory()->for($device)->create([
        'recorded_at' => Carbon::now(),
        'produced_wh' => 0,
        'consumed_wh' => 1000,
        'exported_wh' => 0,
        'imported_wh' => 1000,
    ]);

    (new RouteSurplusListener(new SurplusRouter))->handle(new EnergyReadingRecorded($reading));

    expect(RoutingDecision::count())->toBe(0);
});

it('creates a P2pTrade and reduces offer kwh when routing to a neighbour', function () {
    $producer = User::factory()->prosumer()->create();
    $consumer = User::factory()->prosumer()->create();

    $producerDevice = Device::factory()->for($producer)->create();
    Address::factory()->prosumer(peakKwp: 6.0)->for($producer)->create([
        'lat' => 40.415,
        'lon' => -3.700,
    ]);
    Address::factory()->for($consumer)->create([
        'lat' => 40.416,
        'lon' => -3.701,
    ]);

    // Offer at higher price than PVPC so P2P wins routing
    $offer = P2pOffer::factory()->for($consumer, 'producer')->create([
        'price_eur_kwh' => 0.20,
        'kwh_available' => 5.0,
        'status' => 'active',
        'valid_until' => now()->addHour(),
    ]);

    $reading = EnergyReading::factory()->for($producerDevice)->create([
        'recorded_at' => Carbon::now(),
        'produced_wh' => 4000,
        'consumed_wh' => 500,
        'exported_wh' => 3500,
        'imported_wh' => 0,
    ]);

    (new RouteSurplusListener(new SurplusRouter))->handle(new EnergyReadingRecorded($reading));

    $trade = P2pTrade::first();
    expect($trade)->not->toBeNull()
        ->and($trade->producer_id)->toBe($producer->id)
        ->and($trade->consumer_id)->toBe($consumer->id);

    $offer->refresh();
    expect((float) $offer->kwh_available)->toBeLessThan(5.0);
});
