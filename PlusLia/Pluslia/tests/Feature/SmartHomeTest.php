<?php

use App\Models\Device;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('renders the smart home page', function () {
    $this->get(route('smart-home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->has('devices')
            ->has('userType')
            ->has('radiation')
        );
});

it('includes device status and metadata in home page response', function () {
    $device = Device::factory()->create([
        'user_id' => $this->user->id,
        'status' => 'active',
        'manufacturer' => 'Fronius',
        'serial_number' => 'SN-001',
        'last_reading_at' => now()->subMinutes(5),
    ]);

    $this->get(route('smart-home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->has('devices', 1, fn ($d) => $d
                ->where('id', $device->id)
                ->where('status', 'active')
                ->where('manufacturer', 'Fronius')
                ->where('serial_number', 'SN-001')
                ->whereNot('last_reading_at', null)
                ->etc()
            )
        );
});

it('registers a device with optional metadata', function () {
    $this->post(route('smart-home.device.register'), [
        'type' => 'inverter',
        'model' => 'Fronius Primo 5.0',
        'manufacturer' => 'Fronius',
        'serial_number' => 'SN-FRONIUS-001',
        'installation_date' => '2025-01-15',
    ])->assertRedirect();

    $this->assertDatabaseHas('devices', [
        'user_id' => $this->user->id,
        'type' => 'inverter',
        'model' => 'Fronius Primo 5.0',
        'manufacturer' => 'Fronius',
        'serial_number' => 'SN-FRONIUS-001',
        'status' => 'active',
    ]);
});

it('registers a device with only required fields', function () {
    $this->post(route('smart-home.device.register'), [
        'type' => 'smart_meter',
        'model' => 'Shelly 3EM',
    ])->assertRedirect();

    $this->assertDatabaseHas('devices', [
        'user_id' => $this->user->id,
        'type' => 'smart_meter',
        'model' => 'Shelly 3EM',
        'status' => 'active',
    ]);
});

it('rejects duplicate serial numbers', function () {
    Device::factory()->create(['serial_number' => 'SN-DUPE']);

    $this->post(route('smart-home.device.register'), [
        'type' => 'inverter',
        'model' => 'Test',
        'serial_number' => 'SN-DUPE',
    ])->assertSessionHasErrors('serial_number');
});

it('validates device type', function () {
    $this->post(route('smart-home.device.register'), [
        'type' => 'unknown_type',
        'model' => 'Test',
    ])->assertSessionHasErrors('type');
});

it('deletes own device', function () {
    $device = Device::factory()->create(['user_id' => $this->user->id]);

    $this->delete(route('smart-home.device.delete', $device))
        ->assertRedirect();

    $this->assertModelMissing($device);
});

it('cannot delete another user device', function () {
    $other = User::factory()->create();
    $device = Device::factory()->create(['user_id' => $other->id]);

    $this->delete(route('smart-home.device.delete', $device))
        ->assertForbidden();
});

it('regenerates device token', function () {
    $device = Device::factory()->create([
        'user_id' => $this->user->id,
        'api_token' => 'old-token-' . str_repeat('x', 54),
    ]);

    $this->post(route('smart-home.device.regenerate-token', $device))
        ->assertRedirect();

    expect($device->fresh()->api_token)->not->toBe($device->api_token);
});

it('cannot regenerate token for another user device', function () {
    $other = User::factory()->create();
    $device = Device::factory()->create(['user_id' => $other->id]);

    $this->post(route('smart-home.device.regenerate-token', $device))
        ->assertForbidden();
});

it('updates last_reading_at when a reading is stored via api', function () {
    $device = Device::factory()->create([
        'user_id' => $this->user->id,
        'last_reading_at' => null,
    ]);

    $this->withHeaders(['Authorization' => 'Bearer ' . $device->api_token])
        ->postJson("/api/v1/devices/{$device->id}/readings", [
            'recorded_at' => now()->toIso8601String(),
            'produced_wh' => 1200,
            'consumed_wh' => 800,
            'exported_wh' => 400,
            'imported_wh' => 0,
        ])->assertStatus(202);

    expect($device->fresh()->last_reading_at)->not->toBeNull();
    expect($device->fresh()->status)->toBe('active');
});
