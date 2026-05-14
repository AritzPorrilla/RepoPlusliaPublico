<?php

namespace App\Jobs;

use App\Events\PriceTickUpdated;
use App\Models\PriceTick;
use App\Services\EsiosClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class FetchEsiosPrice implements ShouldQueue
{
    use Queueable;

    public function handle(EsiosClient $client): void
    {
        $price = $client->fetchAndPersist();

        if ($price !== null) {
            \Illuminate\Support\Facades\Cache::put('pvpc_current', $price, 900);

            $latestTick = PriceTick::where('source', 'pvpc')->latest('recorded_at')->first();

            if ($latestTick) {
                PriceTickUpdated::dispatch($latestTick);
            }
        }
    }
}
