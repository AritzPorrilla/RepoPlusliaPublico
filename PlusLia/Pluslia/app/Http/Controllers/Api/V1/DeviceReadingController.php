<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\EnergyReadingRecorded;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReadingRequest;
use App\Models\Device;
use App\Models\EnergyReading;

class DeviceReadingController extends Controller
{
    public function store(StoreReadingRequest $request, Device $device): \Illuminate\Http\Response
    {
        $reading = EnergyReading::create([
            'device_id'    => $device->id,
            'recorded_at'  => $request->input('recorded_at'),
            'produced_wh'  => $request->input('produced_wh'),
            'consumed_wh'  => $request->input('consumed_wh'),
            'exported_wh'  => $request->input('exported_wh'),
            'imported_wh'  => $request->input('imported_wh'),
            'voltage_v'    => $request->input('voltage_v'),
            'frequency_hz' => $request->input('frequency_hz'),
        ]);

        $device->update(['last_reading_at' => now(), 'status' => 'active']);

        // Routing decision is handled asynchronously by RouteSurplusListener
        EnergyReadingRecorded::dispatch($reading);

        return response()->noContent(202);
    }
}
