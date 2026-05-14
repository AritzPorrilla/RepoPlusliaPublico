<?php

namespace App\Providers;

use App\Auth\DeviceTokenGuard;
use App\Events\EnergyReadingRecorded;
use App\Events\MonthlySettlementClosed;
use App\Events\P2pOfferCreated;
use App\Events\PriceTickUpdated;
use App\Listeners\BroadcastPriceListener;
use App\Listeners\GenerateInvoicePdfListener;
use App\Listeners\NotifyEligibleNeighbors;
use App\Listeners\RouteSurplusListener;
use App\Listeners\UpdateDailyAggregateListener;
use App\Services\EsiosClient;
use App\Services\SurplusRouter;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(SurplusRouter::class);

        $this->app->singleton(EsiosClient::class, fn () => new EsiosClient(
            token: config('services.esios.token', ''),
        ));
    }

    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerRateLimiters();
        $this->registerEventListeners();
        $this->registerGuards();
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(app()->isProduction());

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)->mixedCase()->letters()->numbers()->symbols()->uncompromised()
            : null,
        );
    }

    protected function registerRateLimiters(): void
    {
        // 10 req/min per device — aligned with PVPC quarter-hourly frequency
        RateLimiter::for('plc-readings', function (Request $request) {
            $deviceId = $request->route('device')?->id ?? 'unknown';

            return Limit::perMinute(10)->by("device:{$deviceId}");
        });
    }

    protected function registerEventListeners(): void
    {
        Event::listen(EnergyReadingRecorded::class, RouteSurplusListener::class);
        Event::listen(EnergyReadingRecorded::class, UpdateDailyAggregateListener::class);

        Event::listen(PriceTickUpdated::class, BroadcastPriceListener::class);
        Event::listen(P2pOfferCreated::class, NotifyEligibleNeighbors::class);
        Event::listen(MonthlySettlementClosed::class, GenerateInvoicePdfListener::class);
    }

    protected function registerGuards(): void
    {
        Auth::extend('device-token', fn ($app, $name, array $config) => new DeviceTokenGuard(
            $app['request'],
        ));
    }
}
