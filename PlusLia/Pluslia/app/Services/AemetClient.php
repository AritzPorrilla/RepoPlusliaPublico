<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AemetClient
{
    private const BASE_URL = 'https://opendata.aemet.es/opendata/api';

    private const CACHE_TTL = 3600; // 1 hour — radiation data updates hourly

    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.aemet.api_key', '');
    }

    /**
     * Returns the latest radiation reading from the station nearest to the given coordinates.
     *
     * @return array{station: string, location: string, global_w_m2: float, date: string, distance_km: float}|null
     */
    public function getNearestStationRadiation(float $lat, float $lon): ?array
    {
        $stations = $this->fetchRadiationStations();

        if (empty($stations)) {
            return null;
        }

        $nearest = null;
        $minDist = PHP_FLOAT_MAX;

        foreach ($stations as $station) {
            $sLat = isset($station['lat']) ? (float) $station['lat'] : null;
            $sLon = isset($station['lon']) ? (float) $station['lon'] : null;

            if ($sLat === null || $sLon === null) {
                continue;
            }

            $dist = $this->haversineKm($lat, $lon, $sLat, $sLon);
            if ($dist < $minDist) {
                $minDist = $dist;
                $nearest = $station;
            }
        }

        if ($nearest === null) {
            return null;
        }

        $globalRaw = $nearest['globlHoraria'] ?? $nearest['glob'] ?? null;

        return [
            'station' => $nearest['idema'] ?? '—',
            'location' => $nearest['ubi'] ?? 'Desconocida',
            'global_w_m2' => $globalRaw !== null ? round((float) $globalRaw * 1000, 1) : null,
            'global_kwh_m2' => $globalRaw !== null ? round((float) $globalRaw, 3) : null,
            'date' => $nearest['fecha'] ?? null,
            'distance_km' => round($minDist, 1),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchRadiationStations(): array
    {
        try {
            return Cache::remember('aemet.radiation.stations', self::CACHE_TTL, function () {
                $response = Http::timeout(8)
                    ->withHeaders(['api_key' => $this->apiKey])
                    ->get(self::BASE_URL . '/red/especial/radiacion/');

                if (! $response->successful()) {
                    Log::warning('AEMET radiation API error', ['status' => $response->status()]);
                    return [];
                }

                $datosUrl = $response->json('datos');

                if (empty($datosUrl)) {
                    return [];
                }

                $dataResponse = Http::timeout(8)->get($datosUrl);

                if (! $dataResponse->successful()) {
                    Log::warning('AEMET datos URL error', ['status' => $dataResponse->status()]);
                    return [];
                }

                return $dataResponse->json() ?? [];
            });
        } catch (\Throwable $e) {
            Log::warning('AEMET API unreachable', ['error' => $e->getMessage()]);
            return [];
        }
    }

    private function haversineKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $R = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return 2.0 * $R * asin(sqrt($a));
    }
}
