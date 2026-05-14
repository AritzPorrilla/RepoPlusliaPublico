<?php

namespace App\Listeners;

use App\Events\P2pOfferCreated;
use App\Models\Address;
use App\Support\Haversine;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;

class NotifyEligibleNeighbors implements ShouldQueue
{
    public function handle(P2pOfferCreated $event): void
    {
        $offer = $event->offer;
        $producer = $offer->producer()->with('address', 'communities')->first();

        if (! $producer?->address) {
            return;
        }

        $community = $producer->communities()->first();
        $maxDistance = $community?->max_distance_m ?? 5000;

        $producerLat = (float) $producer->address->lat;
        $producerLon = (float) $producer->address->lon;

        Address::with('user')
            ->whereNot('user_id', $producer->id)
            ->get()
            ->filter(fn (Address $addr) => Haversine::meters(
                $producerLat, $producerLon,
                (float) $addr->lat, (float) $addr->lon,
            ) <= $maxDistance)
            ->each(function (Address $addr) use ($offer) {
                broadcast(new class($addr->user_id, $offer->id) implements ShouldBroadcast
                {
                    public function __construct(
                        private readonly int $userId,
                        private readonly int $offerId,
                    ) {}

                    public function broadcastOn(): array
                    {
                        return [new PrivateChannel("user.{$this->userId}")];
                    }

                    public function broadcastAs(): string
                    {
                        return 'offer.available';
                    }

                    public function broadcastWith(): array
                    {
                        return ['offer_id' => $this->offerId];
                    }
                });
            });
    }
}
