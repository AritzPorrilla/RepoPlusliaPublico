<?php

namespace App\Events;

use App\Models\PriceTick;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PriceTickUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly PriceTick $priceTick) {}
}
