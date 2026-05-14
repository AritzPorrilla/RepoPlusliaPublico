<?php

use App\Services\SavingsEstimator;

beforeEach(function () {
    $this->estimator = new SavingsEstimator;
});

it('returns a range for a prosumer with 5 kWp', function () {
    $result = $this->estimator->forProsumer(peakPowerKwp: 5.0, pvpcPriceEurKwh: 0.15);

    expect($result['min_kwh'])->toBeLessThan($result['max_kwh'])
        ->and($result['min_eur'])->toBeLessThan($result['max_eur'])
        ->and($result['min_kwh'])->toBeGreaterThan(0);
});

it('calculates prosumer range correctly at known values', function () {
    // 1 kWp × 3.5 × 365 × 0.75 = 958.125 → 958.13
    // 1 kWp × 5.0 × 365 × 0.85 = 1551.25
    $result = $this->estimator->forProsumer(peakPowerKwp: 1.0, pvpcPriceEurKwh: 0.10);

    expect($result['min_kwh'])->toBe(958.13)
        ->and($result['max_kwh'])->toBe(1551.25)
        ->and($result['min_eur'])->toBe(95.81)
        ->and($result['max_eur'])->toBe(155.13);
});

it('returns a range for a consumer with annual consumption', function () {
    $result = $this->estimator->forConsumer(
        annualConsumptionKwh: 3000.0,
        pvpcPriceEurKwh: 0.15,
        p2pPriceEurKwh: 0.10,
    );

    // 30–50 % of 3000 = 900–1500 kWh; saving = 0.05 €/kWh
    expect($result['min_kwh'])->toBe(900.0)
        ->and($result['max_kwh'])->toBe(1500.0)
        ->and($result['min_eur'])->toBe(45.0)
        ->and($result['max_eur'])->toBe(75.0);
});

it('returns zero savings when p2p price equals pvpc', function () {
    $result = $this->estimator->forConsumer(
        annualConsumptionKwh: 2000.0,
        pvpcPriceEurKwh: 0.15,
        p2pPriceEurKwh: 0.15,
    );

    expect($result['min_eur'])->toBe(0.0)
        ->and($result['max_eur'])->toBe(0.0);
});

it('returns correct estimate via the API endpoint', function () {
    $response = $this->getJson('/api/v1/savings-estimate?type=prosumer&peak_power_kwp=3');

    $response->assertOk()
        ->assertJsonStructure([
            'pvpc_reference_eur_kwh',
            'estimate' => ['min_kwh', 'max_kwh', 'min_eur', 'max_eur'],
        ]);
});
