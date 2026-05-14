<?php

namespace App\Services;

/**
 * Estimates annual energy savings based on §5.1 of the EnergyShare exercise.
 *
 * HSP (Horas Solar Pico) ranges from 3.5 (north Spain) to 5.0 (south Spain).
 * η (system efficiency) assumed 0.75 (conservative) – 0.85 (optimal).
 */
class SavingsEstimator
{
    private const HSP_MIN = 3.5;

    private const HSP_MAX = 5.0;

    private const ETA_MIN = 0.75;

    private const ETA_MAX = 0.85;

    // Community coverage for consumers: 30–50 % of consumption
    private const CONSUMER_COVERAGE_MIN = 0.30;

    private const CONSUMER_COVERAGE_MAX = 0.50;

    /**
     * Estimate annual savings for a prosumer (has solar panels).
     *
     * @param  float  $peakPowerKwp  Installed peak power in kWp
     * @param  float  $pvpcPriceEurKwh  Current PVPC reference price
     * @return array{min_kwh: float, max_kwh: float, min_eur: float, max_eur: float}
     */
    public function forProsumer(float $peakPowerKwp, float $pvpcPriceEurKwh): array
    {
        $minKwh = round($peakPowerKwp * self::HSP_MIN * 365 * self::ETA_MIN, 2);
        $maxKwh = round($peakPowerKwp * self::HSP_MAX * 365 * self::ETA_MAX, 2);

        return [
            'min_kwh' => $minKwh,
            'max_kwh' => $maxKwh,
            'min_eur' => round($minKwh * $pvpcPriceEurKwh, 2),
            'max_eur' => round($maxKwh * $pvpcPriceEurKwh, 2),
        ];
    }

    /**
     * Estimate annual savings for a consumer (no panels, buys from community).
     *
     * @param  float  $annualConsumptionKwh  Baseline annual consumption
     * @param  float  $pvpcPriceEurKwh  Grid reference price (what they pay now)
     * @param  float  $p2pPriceEurKwh  Community P2P buy price (what they'll pay instead)
     * @return array{min_kwh: float, max_kwh: float, min_eur: float, max_eur: float}
     */
    public function forConsumer(
        float $annualConsumptionKwh,
        float $pvpcPriceEurKwh,
        float $p2pPriceEurKwh,
    ): array {
        $minKwh = round($annualConsumptionKwh * self::CONSUMER_COVERAGE_MIN, 2);
        $maxKwh = round($annualConsumptionKwh * self::CONSUMER_COVERAGE_MAX, 2);
        $priceDiff = max(0.0, $pvpcPriceEurKwh - $p2pPriceEurKwh);

        return [
            'min_kwh' => $minKwh,
            'max_kwh' => $maxKwh,
            'min_eur' => round($minKwh * $priceDiff, 2),
            'max_eur' => round($maxKwh * $priceDiff, 2),
        ];
    }
}
