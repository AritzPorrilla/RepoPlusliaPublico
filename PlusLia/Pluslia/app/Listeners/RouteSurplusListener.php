<?php

namespace App\Listeners;

use App\DTOs\NeighborDemandDTO;
use App\DTOs\RetailerPriceDTO;
use App\Events\EnergyReadingRecorded;
use App\Events\TradeExecuted;
use App\Models\P2pOffer;
use App\Models\P2pTrade;
use App\Models\PriceTick;
use App\Models\RoutingDecision;
use App\Services\SurplusRouter;
use Illuminate\Contracts\Queue\ShouldQueue;

class RouteSurplusListener implements ShouldQueue
{
    public function __construct(private readonly SurplusRouter $router) {}

    public function handle(EnergyReadingRecorded $event): void
    {
        $reading = $event->reading;
        $surplusKwh = $reading->exported_wh / 1000;

        if ($surplusKwh <= 0) {
            return;
        }

        $device = $reading->device()->with('user.address')->first();
        $address = $device?->user?->address;

        if (! $address) {
            return;
        }

        $community = $device->user->communities()->first();
        $maxDistance = $community?->max_distance_m ?? 5000;

        $pvpcPrice = PriceTick::where('source', 'pvpc')
            ->orderByDesc('recorded_at')
            ->value('price_eur_kwh') ?? 0.05;

        $retailerPrices = collect([
            new RetailerPriceDTO('Repsol', 0.10),
            new RetailerPriceDTO('Naturgy', 0.07),
            new RetailerPriceDTO('Endesa', 0.06),
            new RetailerPriceDTO('Iberdrola', 0.04),
        ]);

        $activeOffers = P2pOffer::active()
            ->with('producer.address')
            ->whereNot('producer_id', $device->user_id)
            ->get();

        $neighborDemands = $activeOffers->map(fn ($offer) => new NeighborDemandDTO(
            userId: $offer->producer_id,
            lat: (float) ($offer->producer->address->lat ?? 0),
            lon: (float) ($offer->producer->address->lon ?? 0),
            kwhWanted: (float) $offer->kwh_available,
            offeredPrice: (float) $offer->price_eur_kwh,
        ));

        $decision = $this->router->bestDestination(
            $address,
            $surplusKwh,
            $neighborDemands,
            (float) $pvpcPrice,
            $retailerPrices,
            $maxDistance,
        );

        RoutingDecision::create([
            'device_id' => $reading->device_id,
            'recorded_at' => $reading->recorded_at,
            'destination' => $decision->destination,
            'price_applied' => $decision->priceEurKwh,
            'kwh' => $decision->kwh,
        ]);

        if (str_starts_with($decision->destination, 'P2P-')) {
            $consumerId = (int) substr($decision->destination, 4);

            P2pTrade::create([
                'producer_id' => $device->user_id,
                'consumer_id' => $consumerId,
                'kwh' => $decision->kwh,
                'price_eur_kwh' => $decision->priceEurKwh,
                'recorded_at' => $reading->recorded_at,
            ]);

            $trade = P2pTrade::where('producer_id', $device->user_id)
                ->where('consumer_id', $consumerId)
                ->where('recorded_at', $reading->recorded_at)
                ->latest()
                ->first();

            if ($trade) {
                TradeExecuted::dispatch($trade);
            }

            $matchedOffer = $activeOffers->firstWhere('producer_id', $consumerId);
            if ($matchedOffer) {
                $remaining = max(0, (float) $matchedOffer->kwh_available - $decision->kwh);
                $matchedOffer->update([
                    'kwh_available' => $remaining,
                    'status' => $remaining <= 0 ? 'fulfilled' : 'active',
                ]);
            }
        }
    }
}
