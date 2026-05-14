<?php

namespace App\Services;

use App\Models\PriceTick;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EsiosClient
{
    private const INDICATOR_PVPC = 1739;

    private const CACHE_KEY_CURRENT = 'pvpc_current';

    private const CACHE_TTL = 900; // 15 minutes

    private const REDATA_URL = 'https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real';

    private const PRECIODELALUZ_URL = 'https://api.preciodelaluz.org/v1/prices';

    private const GEO_ID_PENINSULA = 8741;

    public function __construct(private readonly string $token = '') {}

    /**
     * Returns the current PVPC price in €/kWh, from cache when possible.
     */
    public function currentPvpcPrice(): float
    {
        return Cache::remember(self::CACHE_KEY_CURRENT, self::CACHE_TTL, function () {
            return $this->fetchAndPersist() ?? 0.05;
        });
    }

    /**
     * Fetches PVPC values and stores them in price_ticks.
     * Priority: ESIOS (with token) → preciodelaluz.org → REData public API.
     */
    public function fetchAndPersist(): ?float
    {
        if ($this->token !== '') {
            return $this->fetchFromEsios();
        }

        // REData (REE official) is primary; preciodelaluz.org is fallback
        $price = $this->fetchFromReData();

        return $price ?? $this->fetchFromPreciodelaluz();
    }

    /**
     * Fetches current + all-day prices from preciodelaluz.org.
     * Simple, fast, and reliable — no API key needed.
     * Returns price in €/kWh for the current hour.
     */
    private function fetchFromPreciodelaluz(): ?float
    {
        try {
            $now = Carbon::now('Europe/Madrid');

            // Fetch all prices for today so we can store the full day schedule
            $response = Http::timeout(8)
                ->get(self::PRECIODELALUZ_URL.'/all', ['zone' => 'PCB']);

            $response->throw();

            /** @var array<string, array{date: string, hour: string, price: float, market: string}> $hours */
            $hours = $response->json() ?? [];

            $currentPrice = null;
            $currentHour = $now->format('H');

            foreach ($hours as $entry) {
                if (! isset($entry['price'], $entry['hour'], $entry['date'])) {
                    continue;
                }

                $priceEurKwh = round((float) $entry['price'], 6); // already in €/kWh
                $hourInt = (int) $entry['hour'] - 1; // API returns 1-24, convert to 0-23
                $timestamp = Carbon::parse($entry['date'])->setHour($hourInt)->setMinute(0)->setSecond(0)->utc();

                PriceTick::updateOrCreate(
                    ['source' => 'pvpc', 'recorded_at' => $timestamp],
                    ['price_eur_kwh' => $priceEurKwh],
                );

                if ((string) $hourInt === $currentHour) {
                    $currentPrice = $priceEurKwh;
                }
            }

            if ($currentPrice === null) {
                Log::info('preciodelaluz.org: no price for current hour, using latest from DB');
                $currentPrice = PriceTick::where('source', 'pvpc')
                    ->where('recorded_at', '>=', $now->copy()->startOfDay()->utc())
                    ->orderByDesc('recorded_at')
                    ->value('price_eur_kwh');
            }

            return $currentPrice;
        } catch (RequestException $e) {
            Log::warning('preciodelaluz.org request failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    private function fetchFromEsios(): ?float
    {
        try {
            $now = Carbon::now('Europe/Madrid');
            $startDate = $now->copy()->startOfDay()->toIso8601String();
            $endDate = $now->copy()->endOfDay()->toIso8601String();

            $response = Http::withToken($this->token)
                ->timeout(10)
                ->get('https://api.esios.ree.es/indicators/'.self::INDICATOR_PVPC, [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ]);

            $response->throw();

            $values = $response->json('indicator.values') ?? [];

            return $this->persistValues($values, 'datetime', $now->copy()->floorMinutes(15)->utc());
        } catch (RequestException $e) {
            Log::warning('ESIOS API request failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    private function fetchFromReData(): ?float
    {
        try {
            $now = Carbon::now('Europe/Madrid');

            $response = Http::timeout(10)
                ->get(self::REDATA_URL, [
                    'start_date' => $now->copy()->startOfDay()->format('Y-m-d\TH:i'),
                    'end_date' => $now->copy()->endOfDay()->format('Y-m-d\TH:i'),
                    'time_trunc' => 'hour',
                    'geo_ids[]' => self::GEO_ID_PENINSULA,
                ]);

            $response->throw();

            $included = $response->json('included') ?? [];
            $pvpcSeries = collect($included)->firstWhere('type', 'PVPC');
            $values = $pvpcSeries['attributes']['values'] ?? [];

            $currentPrice = $this->persistValues($values, 'datetime', $now->copy()->startOfHour()->utc());

            if ($currentPrice === null) {
                $currentPrice = PriceTick::query()
                    ->where('source', 'pvpc')
                    ->where('recorded_at', '>=', $now->copy()->startOfDay()->utc())
                    ->orderByDesc('recorded_at')
                    ->value('price_eur_kwh');
            }

            return $currentPrice;
        } catch (RequestException $e) {
            Log::warning('REData API request failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * @param  array<int, array{datetime: string, value: float|int}>  $values
     */
    private function persistValues(array $values, string $datetimeKey, Carbon $targetTimestamp): ?float
    {
        $currentPrice = null;

        foreach ($values as $entry) {
            $timestamp = Carbon::parse($entry[$datetimeKey])->utc();
            $priceEurKwh = round(($entry['value'] ?? 0) / 1000, 6); // API returns €/MWh

            PriceTick::updateOrCreate(
                ['source' => 'pvpc', 'recorded_at' => $timestamp],
                ['price_eur_kwh' => $priceEurKwh],
            );

            if ($timestamp->eq($targetTimestamp)) {
                $currentPrice = $priceEurKwh;
            }
        }

        return $currentPrice;
    }
}
