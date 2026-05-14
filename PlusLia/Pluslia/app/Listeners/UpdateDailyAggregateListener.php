<?php

namespace App\Listeners;

use App\Events\EnergyReadingRecorded;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;

class UpdateDailyAggregateListener implements ShouldQueue
{
    public function handle(EnergyReadingRecorded $event): void
    {
        $reading = $event->reading;
        $userId = $reading->device->user_id;
        $day = $reading->recorded_at->toDateString();

        DB::statement(<<<'SQL'
            INSERT INTO daily_aggregates
                (user_id, day, produced_kwh, consumed_kwh, surplus_kwh, grid_exported_kwh, grid_imported_kwh)
            VALUES
                (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (user_id, day) DO UPDATE SET
                produced_kwh      = daily_aggregates.produced_kwh      + EXCLUDED.produced_kwh,
                consumed_kwh      = daily_aggregates.consumed_kwh      + EXCLUDED.consumed_kwh,
                surplus_kwh       = daily_aggregates.surplus_kwh       + EXCLUDED.surplus_kwh,
                grid_exported_kwh = daily_aggregates.grid_exported_kwh + EXCLUDED.grid_exported_kwh,
                grid_imported_kwh = daily_aggregates.grid_imported_kwh + EXCLUDED.grid_imported_kwh
            SQL,
            [
                $userId,
                $day,
                $reading->produced_wh / 1000,
                $reading->consumed_wh / 1000,
                $reading->exported_wh / 1000,
                $reading->exported_wh / 1000,
                $reading->imported_wh / 1000,
            ],
        );
    }
}
