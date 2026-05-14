<?php

namespace App\Listeners;

use App\Events\PriceTickUpdated;
use App\Models\EnergyCommunity;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;

class BroadcastPriceListener implements ShouldQueue
{
    public function handle(PriceTickUpdated $event): void
    {
        $payload = [
            'source' => $event->priceTick->source,
            'price_eur_kwh' => (float) $event->priceTick->price_eur_kwh,
            'recorded_at' => $event->priceTick->recorded_at->toIso8601String(),
        ];

        EnergyCommunity::all()->each(function (EnergyCommunity $community) use ($payload) {
            broadcast(new class($community->id, $payload) implements ShouldBroadcast
            {
                public function __construct(
                    private readonly int $communityId,
                    public readonly array $data,
                ) {}

                public function broadcastOn(): array
                {
                    return [new PrivateChannel("community.{$this->communityId}")];
                }

                public function broadcastAs(): string
                {
                    return 'price.updated';
                }
            });
        });
    }
}
