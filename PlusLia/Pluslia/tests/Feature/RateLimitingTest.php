<?php

use App\Models\Device;
use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['prosumer', 'consumer', 'admin'] as $role) {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
    }

    RateLimiter::clear('device:1');
});

it('accepts readings within the rate limit', function () {
    $user = User::factory()->prosumer()->create();
    $device = Device::factory()->for($user)->create();

    $payload = [
        'recorded_at' => now()->toIso8601String(),
        'produced_wh' => 500,
        'consumed_wh' => 200,
        'exported_wh' => 300,
        'imported_wh' => 0,
    ];

    $response = $this->withToken($device->api_token)
        ->postJson("/api/v1/devices/{$device->id}/readings", $payload);

    $response->assertStatus(202);
});

it('returns 429 after exceeding 10 requests per minute', function () {
    $user = User::factory()->prosumer()->create();
    $device = Device::factory()->for($user)->create();

    $payload = [
        'recorded_at' => now()->toIso8601String(),
        'produced_wh' => 100,
        'consumed_wh' => 100,
        'exported_wh' => 0,
        'imported_wh' => 0,
    ];

    for ($i = 0; $i < 10; $i++) {
        $this->withToken($device->api_token)
            ->postJson("/api/v1/devices/{$device->id}/readings", $payload)
            ->assertStatus(202);
    }

    $this->withToken($device->api_token)
        ->postJson("/api/v1/devices/{$device->id}/readings", $payload)
        ->assertStatus(429);
});
