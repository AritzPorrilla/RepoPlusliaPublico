<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PriceTick;
use App\Services\SavingsEstimator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavingsEstimateController extends Controller
{
    public function __construct(private readonly SavingsEstimator $estimator) {}

    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'in:prosumer,consumer'],
            'peak_power_kwp' => ['required_if:type,prosumer', 'nullable', 'numeric', 'min:0.1'],
            'annual_consumption_kwh' => ['required_if:type,consumer', 'nullable', 'numeric', 'min:1'],
            'p2p_price_eur_kwh' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $pvpc = (float) (PriceTick::where('source', 'pvpc')
            ->orderByDesc('recorded_at')
            ->value('price_eur_kwh') ?? 0.15);

        if ($request->input('type') === 'prosumer') {
            $estimate = $this->estimator->forProsumer(
                (float) $request->input('peak_power_kwp'),
                $pvpc,
            );
        } else {
            $estimate = $this->estimator->forConsumer(
                (float) $request->input('annual_consumption_kwh'),
                $pvpc,
                (float) $request->input('p2p_price_eur_kwh', $pvpc * 0.8),
            );
        }

        return response()->json([
            'pvpc_reference_eur_kwh' => $pvpc,
            'estimate' => $estimate,
        ]);
    }
}
