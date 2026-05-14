<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAddressRequest;
use App\Models\PriceTick;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->user()->address()->exists()) {
            return redirect()->route('dashboard');
        }

        $pvpc = (float) (PriceTick::where('source', 'pvpc')
            ->orderByDesc('recorded_at')
            ->value('price_eur_kwh') ?? 0.15);

        return Inertia::render('onboarding/index', [
            'pvpcEurKwh' => $pvpc,
        ]);
    }

    public function store(StoreAddressRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->update([
            'user_type' => $request->user_type,
            'tariff' => $request->tariff,
            'annual_consumption_kwh' => round($request->monthly_consumption_kwh * 12, 2),
            'contracted_power_kw' => $request->contracted_power_kw,
        ]);

        $user->address()->create($request->addressData());

        return redirect()->route('dashboard')->with('success', '¡Configuración completada! Bienvenido a Pluslia.');
    }
}
