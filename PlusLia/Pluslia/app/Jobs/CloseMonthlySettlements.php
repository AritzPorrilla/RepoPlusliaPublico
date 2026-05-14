<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;

class CloseMonthlySettlements implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected ?string $month = null)
    {
    }

    public function handle(): void
    {
        $arguments = [];

        if ($this->month !== null) {
            $arguments['--month'] = $this->month;
        }

        Artisan::call('settlement:generate', $arguments);
    }
}
