<?php

namespace App\Events;

use App\Models\EnergyReading;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EnergyReadingRecorded
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly EnergyReading $reading,
    ) {}
}
