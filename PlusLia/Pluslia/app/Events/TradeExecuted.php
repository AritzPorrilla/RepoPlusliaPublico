<?php

namespace App\Events;

use App\Models\P2pTrade;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TradeExecuted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly P2pTrade $trade) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->trade->producer_id}"),
            new PrivateChannel("user.{$this->trade->consumer_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'trade.executed';
    }
}
