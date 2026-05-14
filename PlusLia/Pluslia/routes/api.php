<?php

use App\Http\Controllers\Api\V1\DeviceReadingController;
use App\Http\Controllers\Api\V1\SavingsEstimateController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::middleware('auth:device-token')->group(function () {
        Route::post('devices/{device}/readings', [DeviceReadingController::class, 'store'])
            ->middleware('throttle:plc-readings')
            ->name('api.v1.devices.readings.store');
    });

    Route::get('savings-estimate', SavingsEstimateController::class)
        ->name('api.v1.savings-estimate');
});
