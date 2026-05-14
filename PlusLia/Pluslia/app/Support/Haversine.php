<?php

namespace App\Support;

class Haversine
{
    public static function meters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6_371_000;

        $phi1 = deg2rad($lat1);
        $phi2 = deg2rad($lat2);
        $dPhi = deg2rad($lat2 - $lat1);
        $dLambda = deg2rad($lon2 - $lon1);

        $a = sin($dPhi / 2) ** 2
            + cos($phi1) * cos($phi2) * sin($dLambda / 2) ** 2;

        return 2 * $earthRadius * asin(sqrt($a));
    }
}
