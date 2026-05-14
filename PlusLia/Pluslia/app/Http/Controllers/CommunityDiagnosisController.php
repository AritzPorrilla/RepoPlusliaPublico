<?php

namespace App\Http\Controllers;

use App\Models\CommunityDiagnosis;
use App\Models\EnergyCommunity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityDiagnosisController extends Controller
{
    private function getCommunity(Request $request): EnergyCommunity
    {
        return $request->user()->communities()->firstOrFail();
    }

    public function show(Request $request): Response
    {
        $community = $this->getCommunity($request);
        $user = $request->user();
        $isAdmin = $user->isCommunityAdminOf($community);

        $myDiagnosis = $community->diagnoses()->where('user_id', $user->id)->first();

        $allDiagnoses = $community->diagnoses()
            ->with('user:id,name')
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'user_name' => $d->user->name,
                'roof_m2' => $d->roof_m2 ? (float) $d->roof_m2 : null,
                'monthly_kwh' => $d->monthly_kwh ? (float) $d->monthly_kwh : null,
                'interest_level' => $d->interest_level,
                'has_own_panels' => $d->has_own_panels,
                'notes' => $d->notes,
            ]);

        $viability = $this->computeViability($allDiagnoses->toArray());

        return Inertia::render('community/diagnosis', [
            'community' => ['id' => $community->id, 'name' => $community->name],
            'myDiagnosis' => $myDiagnosis ? [
                'roof_m2' => $myDiagnosis->roof_m2 ? (float) $myDiagnosis->roof_m2 : null,
                'monthly_kwh' => $myDiagnosis->monthly_kwh ? (float) $myDiagnosis->monthly_kwh : null,
                'interest_level' => $myDiagnosis->interest_level,
                'has_own_panels' => $myDiagnosis->has_own_panels,
                'notes' => $myDiagnosis->notes ?? '',
            ] : null,
            'diagnoses' => $isAdmin ? $allDiagnoses : [],
            'viability' => $isAdmin ? $viability : null,
            'isAdmin' => $isAdmin,
            'totalMembers' => $community->members()->count(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $community = $this->getCommunity($request);

        $data = $request->validate([
            'roof_m2' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'monthly_kwh' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'interest_level' => ['required', 'in:high,medium,low'],
            'has_own_panels' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $community->diagnoses()->updateOrCreate(
            ['user_id' => $request->user()->id],
            array_merge($data, ['community_id' => $community->id]),
        );

        return back()->with('success', 'Diagnóstico guardado correctamente.');
    }

    /** @param array<int, array<string, mixed>> $diagnoses */
    private function computeViability(array $diagnoses): array
    {
        $totalRoofM2 = collect($diagnoses)->sum('roof_m2');
        $totalMonthlyKwh = collect($diagnoses)->sum('monthly_kwh');
        $highInterest = collect($diagnoses)->where('interest_level', 'high')->count();
        $withPanels = collect($diagnoses)->where('has_own_panels', true)->count();
        $responded = count($diagnoses);

        // 150 Wp/m² — conservative standard for Spain
        $peakPowerKwp = round($totalRoofM2 * 0.15, 1);

        // 1 500 kWh/kWp/year — Spanish average (AEMET south-center)
        $annualProductionKwh = round($peakPowerKwp * 1500);

        // ~0.15 €/kWh average PVPC
        $annualSavingsEur = round($annualProductionKwh * 0.15, 2);

        // ~1 000 €/kWp installed (rough community-scale estimate)
        $estimatedInvestmentEur = round($peakPowerKwp * 1000);

        $paybackYears = $annualSavingsEur > 0
            ? round($estimatedInvestmentEur / $annualSavingsEur, 1)
            : null;

        // 0.25 kg CO2 per kWh (Spanish grid mix)
        $co2SavedKg = round($annualProductionKwh * 0.25);

        $annualDemandKwh = $totalMonthlyKwh * 12;
        $selfSufficiency = $annualDemandKwh > 0
            ? min(100, round($annualProductionKwh / $annualDemandKwh * 100))
            : null;

        return [
            'responded' => $responded,
            'high_interest' => $highInterest,
            'with_panels' => $withPanels,
            'total_roof_m2' => round((float) $totalRoofM2, 1),
            'total_monthly_kwh' => round((float) $totalMonthlyKwh, 1),
            'peak_power_kwp' => $peakPowerKwp,
            'annual_production_kwh' => $annualProductionKwh,
            'annual_savings_eur' => $annualSavingsEur,
            'estimated_investment_eur' => $estimatedInvestmentEur,
            'payback_years' => $paybackYears,
            'co2_saved_kg' => $co2SavedKg,
            'self_sufficiency_pct' => $selfSufficiency,
        ];
    }
}
