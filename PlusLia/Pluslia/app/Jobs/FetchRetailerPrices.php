<?php

namespace App\Jobs;

use App\Models\PriceTick;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class FetchRetailerPrices implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $timestamp = Carbon::now('Europe/Madrid')->startOfHour();
        $pvpc = PriceTick::where('source', 'pvpc')
            ->where('recorded_at', $timestamp)
            ->value('price_eur_kwh') ?? 0.075;

        $retailerPricing = [
            'repsol' => $pvpc + 0.042,
            'naturgy' => $pvpc + 0.032,
            'endesa' => $pvpc + 0.022,
        ];

        foreach ($retailerPricing as $source => $price) {
            PriceTick::updateOrCreate(
                ['source' => $source, 'recorded_at' => $timestamp],
                ['price_eur_kwh' => round($price, 6)],
            );
        }
    }
}
