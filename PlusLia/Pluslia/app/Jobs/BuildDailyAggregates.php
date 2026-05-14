<?php

namespace App\Jobs;

use App\Models\DailyAggregate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BuildDailyAggregates implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected ?string $startDate = null,
        protected ?string $endDate = null,
    ) {
    }

    public function handle(): void
    {
        $end = Carbon::parse($this->endDate ?? now()->subDay()->toDateString())->endOfDay();
        $start = Carbon::parse($this->startDate ?? $end->copy()->startOfDay())->startOfDay();

        DB::transaction(function () use ($start, $end): void {
            DailyAggregate::whereBetween('day', [$start->toDateString(), $end->toDateString()])->delete();

            DB::statement(
                <<<'SQL'
                    INSERT INTO daily_aggregates
                        (user_id, day, produced_kwh, consumed_kwh, surplus_kwh, grid_exported_kwh, grid_imported_kwh, savings_eur, p2p_sold_kwh, p2p_bought_kwh)
                    SELECT
                        devices.user_id,
                        DATE(energy_readings.recorded_at) AS day,
                        SUM(energy_readings.produced_wh) / 1000.0,
                        SUM(energy_readings.consumed_wh) / 1000.0,
                        SUM(energy_readings.exported_wh) / 1000.0,
                        SUM(energy_readings.exported_wh) / 1000.0,
                        SUM(energy_readings.imported_wh) / 1000.0,
                        0.0,
                        0.0,
                        0.0
                    FROM energy_readings
                    JOIN devices ON devices.id = energy_readings.device_id
                    WHERE energy_readings.recorded_at BETWEEN ? AND ?
                    GROUP BY devices.user_id, DATE(energy_readings.recorded_at)
                SQL,
                [$start->toDateTimeString(), $end->toDateTimeString()],
            );
        });
    }
}
