<?php

namespace App\Events;

use App\Models\MonthlySettlement;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MonthlySettlementClosed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly MonthlySettlement $settlement) {}
}
