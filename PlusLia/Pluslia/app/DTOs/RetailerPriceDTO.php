<?php

namespace App\DTOs;

use Spatie\LaravelData\Data;

class RetailerPriceDTO extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly float $surplusPrice,
    ) {}
}
