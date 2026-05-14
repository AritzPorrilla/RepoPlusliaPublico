<?php

use App\Jobs\FetchEsiosPrice;
use App\Jobs\BuildDailyAggregates;
use App\Jobs\CloseMonthlySettlements;
use App\Jobs\FetchRetailerPrices;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// PVPC price refresh every 15 minutes (quarter-hourly from 30/09/2025)
Schedule::job(new FetchEsiosPrice)->everyFifteenMinutes();

// Retailer price reference refresh every hour
Schedule::job(new FetchRetailerPrices)->hourly();

// Rebuild daily aggregates once per day to keep the materialized dashboard table in sync
Schedule::job(new BuildDailyAggregates)->dailyAt('00:10');

// Simulate PLC readings every 15 min in local/demo environments
Schedule::command('plc:simulate')->everyFifteenMinutes()->environments(['local', 'demo']);

// Close monthly settlements on the 1st of each month at 00:05
Schedule::job(new CloseMonthlySettlements)->monthlyOn(1, '00:05');
