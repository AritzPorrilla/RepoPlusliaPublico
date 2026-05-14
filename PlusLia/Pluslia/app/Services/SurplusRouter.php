<?php

namespace App\Services;

use App\DTOs\NeighborDemandDTO;
use App\DTOs\RetailerPriceDTO;
use App\DTOs\RoutingDecisionDTO;
use App\Models\Address;
use App\Support\Haversine;
use Illuminate\Support\Collection;

class SurplusRouter
{
    /**
     * Decide the best destination for a producer's surplus energy.
     *
     * Priority when two options tie: P2P wins (energy stays in the neighbourhood).
     *
     * @param  Collection<int, NeighborDemandDTO>  $neighborDemands
     * @param  Collection<int, RetailerPriceDTO>  $retailerPrices
     */
    public function bestDestination(
        Address $producerAddress,
        float $surplusKwh,
        Collection $neighborDemands,
        float $pvpcPrice,
        Collection $retailerPrices,
        int $maxDistanceMeters,
    ): RoutingDecisionDTO {
        /** @var Collection<int, array{destination: string, price: float, kwh: float, isP2p: bool}> */
        $candidates = collect();

        $candidates->push([
            'destination' => 'PVPC',
            'price' => $pvpcPrice,
            'kwh' => $surplusKwh,
            'isP2p' => false,
        ]);

        foreach ($retailerPrices as $retailer) {
            $candidates->push([
                'destination' => $retailer->name,
                'price' => $retailer->surplusPrice,
                'kwh' => $surplusKwh,
                'isP2p' => false,
            ]);
        }

        foreach ($neighborDemands as $demand) {
            $distance = Haversine::meters(
                $producerAddress->lat,
                $producerAddress->lon,
                $demand->lat,
                $demand->lon,
            );

            if ($distance > $maxDistanceMeters) {
                continue;
            }

            $assignable = min($demand->kwhWanted, $surplusKwh);

            $candidates->push([
                'destination' => 'P2P-'.$demand->userId,
                'price' => $demand->offeredPrice,
                'kwh' => $assignable,
                'isP2p' => true,
            ]);
        }

        // Sort by expected revenue desc; P2P wins ties
        $best = $candidates
            ->sortBy([
                fn ($a, $b) => ($b['price'] * $b['kwh']) <=> ($a['price'] * $a['kwh']),
                fn ($a, $b) => ($b['isP2p'] ? 1 : 0) <=> ($a['isP2p'] ? 1 : 0),
            ])
            ->first();

        return new RoutingDecisionDTO(
            destination: $best['destination'],
            priceEurKwh: $best['price'],
            kwh: $best['kwh'],
            expectedRevenue: round($best['price'] * $best['kwh'], 6),
        );
    }
}
