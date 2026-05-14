<?php

namespace App\Events;

use App\Models\P2pOffer;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class P2pOfferCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly P2pOffer $offer) {}
}
