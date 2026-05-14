<?php

namespace App\DTOs;

use Spatie\LaravelData\Data;

class NeighborDemandDTO extends Data
{
    public function __construct(
        public readonly int $userId,
        public readonly float $lat,
        public readonly float $lon,
        public readonly float $kwhWanted,
        public readonly float $offeredPrice,
    ) {}
}
