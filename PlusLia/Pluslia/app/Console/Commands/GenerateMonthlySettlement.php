<?php

namespace App\Console\Commands;

use App\Events\MonthlySettlementClosed;
use App\Models\MonthlySettlement;
use App\Models\P2pTrade;
use App\Models\PriceTick;
use App\Models\RoutingDecision;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

#[Signature('settlement:generate {--month= : Month to process in YYYY-MM format (defaults to previous month)}')]
#[Description('Generate monthly energy settlements for all users from their daily aggregates')]
class GenerateMonthlySettlement extends Command
{
    public function handle(): int
    {
        $monthInput = $this->option('month');

        $month = $monthInput
            ? Carbon::createFromFormat('Y-m', $monthInput)->startOfMonth()
            : now()->subMonth()->startOfMonth();

        $monthStart = $month->toDateString();
        $monthEnd = $month->copy()->endOfMonth()->toDateString();

        $this->info("Generating settlements for {$month->format('F Y')}...");

        $avgPvpc = PriceTick::where('source', 'pvpc')
            ->whereBetween('recorded_at', [$monthStart, $monthEnd])
            ->avg('price_eur_kwh') ?? 0.15;

        $users = User::has('dailyAggregates')->get();
        $bar = $this->output->createProgressBar($users->count());
        $bar->start();

        foreach ($users as $user) {
            $this->settleUser($user, $monthStart, $monthEnd, (float) $avgPvpc);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Done.');

        return self::SUCCESS;
    }

    private function settleUser(User $user, string $monthStart, string $monthEnd, float $avgPvpc): void
    {
        $aggregates = $user->dailyAggregates()
            ->whereBetween('day', [$monthStart, $monthEnd])
            ->get();

        if ($aggregates->isEmpty()) {
            return;
        }

        $totalImportedKwh = (float) $aggregates->sum('grid_imported_kwh');
        $totalExportedKwh = (float) $aggregates->sum('grid_exported_kwh');
        $totalP2pBuyKwh = (float) $aggregates->sum('p2p_bought_kwh');
        $totalP2pSellKwh = (float) $aggregates->sum('p2p_sold_kwh');

        // Revenue from routing decisions (grid exports + P2P sales at negotiated prices)
        $exportRevenue = (float) RoutingDecision::whereHas(
            'device', fn ($q) => $q->where('user_id', $user->id)
        )
            ->whereBetween('recorded_at', [$monthStart, $monthEnd])
            ->selectRaw('COALESCE(SUM(price_applied * kwh), 0) as total')
            ->value('total');

        // Cost of P2P energy bought at negotiated prices
        $p2pBuyCost = (float) P2pTrade::where('consumer_id', $user->id)
            ->whereBetween('recorded_at', [$monthStart, $monthEnd])
            ->selectRaw('COALESCE(SUM(price_eur_kwh * kwh), 0) as total')
            ->value('total');

        // Grid import cost at average PVPC for the month
        $gridImportCost = $totalImportedKwh * $avgPvpc;

        // PVPC cap (Ley 24/2013 art. 14.7): export compensation cannot exceed import cost
        $compensacionBruta = $totalExportedKwh * $avgPvpc;
        $excedentePerdidoEur = max(0.0, round($compensacionBruta - $gridImportCost, 4));
        $compensacionCap = min($compensacionBruta, $gridImportCost);

        $balanceEur = round($compensacionCap + $exportRevenue - $p2pBuyCost - $gridImportCost, 4);

        $settlement = MonthlySettlement::updateOrCreate(
            ['user_id' => $user->id, 'month' => Carbon::parse($monthStart)],
            [
                'total_imported_kwh' => $totalImportedKwh,
                'total_exported_kwh' => $totalExportedKwh,
                'total_p2p_buy_kwh' => $totalP2pBuyKwh,
                'total_p2p_sell_kwh' => $totalP2pSellKwh,
                'balance_eur' => $balanceEur,
                'excedente_perdido_eur' => $excedentePerdidoEur,
            ],
        );

        MonthlySettlementClosed::dispatch($settlement);
    }
}
