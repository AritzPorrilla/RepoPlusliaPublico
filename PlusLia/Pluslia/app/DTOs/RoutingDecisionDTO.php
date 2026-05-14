<?php

namespace App\DTOs;

use Spatie\LaravelData\Data;

class RoutingDecisionDTO extends Data
{
    public function __construct(
        public readonly string $destination,
        public readonly float $priceEurKwh,
        public readonly float $kwh,
        public readonly float $expectedRevenue,
    ) {}
}
