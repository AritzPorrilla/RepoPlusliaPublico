<?php

namespace App\Console\Commands;

use App\Events\EnergyReadingRecorded;
use App\Models\Device;
use App\Models\EnergyReading;
use Carbon\CarbonInterface;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('plc:simulate {--device= : Simulate only this device ID} {--backfill=0 : Generate readings for the past N days}')]
#[Description('Simulate PLC/SmartMeter readings for all registered devices')]
class PlcSimulate extends Command
{
    public function handle(): int
    {
        $backfillDays = (int) $this->option('backfill');
        $deviceId = $this->option('device');

        $devices = $deviceId
            ? Device::where('id', $deviceId)->with('user.address')->get()
            : Device::with('user.address')->get();

        if ($devices->isEmpty()) {
            $this->warn('No devices found.');
            return self::FAILURE;
        }

        if ($backfillDays > 0) {
            $this->info("Backfilling {$backfillDays} days for {$devices->count()} device(s)...");
            $this->backfill($devices, $backfillDays);
        } else {
            $this->info("Generating current reading for {$devices->count()} device(s)...");
            $this->generateReadings($devices, now());
        }

        return self::SUCCESS;
    }

    private function backfill($devices, int $days): void
    {
        $bar = $this->output->createProgressBar($days * 96);
        $bar->start();
        $start = now()->subDays($days)->startOfDay();

        for ($d = 0; $d < $days; $d++) {
            for ($q = 0; $q < 96; $q++) {
                $timestamp = $start->copy()->addDays($d)->addMinutes($q * 15);
                $this->generateReadings($devices, $timestamp);
                $bar->advance();
            }
        }

        $bar->finish();
        $this->newLine();
        $this->info('Backfill complete.');
    }

    private function generateReadings($devices, CarbonInterface $timestamp): void
    {
        foreach ($devices as $device) {
            $peakKwp = $device->user?->address?->peak_power_kwp ?? 0;
            $producedWh = $this->simulateProduction((float) $peakKwp, $timestamp);
            $consumedWh = $this->simulateConsumption($timestamp);
            $exportedWh = max(0, $producedWh - $consumedWh);
            $importedWh = max(0, $consumedWh - $producedWh);

            $reading = EnergyReading::create([
                'device_id'    => $device->id,
                'recorded_at'  => $timestamp,
                'produced_wh'  => $producedWh,
                'consumed_wh'  => $consumedWh,
                'exported_wh'  => $exportedWh,
                'imported_wh'  => $importedWh,
                'voltage_v'    => round(230 + mt_rand(-30, 30) / 10, 2),
                'frequency_hz' => round(50 + mt_rand(-5, 5) / 100, 3),
            ]);

            // Only fire events for live (non-backfill) readings
            if ($timestamp->diffInMinutes(now()) < 20) {
                event(new EnergyReadingRecorded($reading));
            }
        }
    }

    private function simulateProduction(float $peakKwp, CarbonInterface $time): int
    {
        if ($peakKwp <= 0) {
            return 0;
        }

        $hour = $time->hour + $time->minute / 60;

        if ($hour < 7 || $hour > 19) {
            return 0;
        }

        $cosArg = M_PI * ($hour - 13) / 12;
        $curve = cos($cosArg) ** 2;

        $dayOfYear   = $time->dayOfYear;
        $seasonality = 0.6 + 0.4 * sin(M_PI * ($dayOfYear - 80) / 365);
        $cloudiness  = 0.3 + mt_rand(0, 70) / 100;

        $powerKw = $peakKwp * $curve * $seasonality * $cloudiness;

        return (int) round($powerKw * 1000 * 0.25);
    }

    private function simulateConsumption(CarbonInterface $time): int
    {
        $hour    = $time->hour;
        $base    = 300;
        $morning = ($hour >= 7 && $hour <= 9) ? 600 : 0;
        $evening = ($hour >= 19 && $hour <= 22) ? 800 : 0;
        $night   = ($hour < 6) ? 100 : 0;
        $total   = $base + $morning + $evening + $night;
        $noise   = mt_rand(-20, 20) / 100;

        return (int) round($total * (1 + $noise) * 0.25);
    }
}
