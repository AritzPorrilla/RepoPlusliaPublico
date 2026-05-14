<?php

namespace App\Http\Controllers;

use App\Models\EnergyCommunity;
use App\Rules\ValidNif;
use App\Services\CifVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    public function verifyCif(Request $request, CifVerificationService $cif): JsonResponse
    {
        $nif = strtoupper(trim((string) $request->query('nif', '')));

        if (! $nif || strlen($nif) !== 9) {
            return response()->json(['checksum_valid' => false, 'registry' => null], 422);
        }

        $checksumValid = $cif->validateChecksum($nif);
        $registry = $checksumValid ? $cif->lookupRegistry($nif) : null;

        return response()->json([
            'checksum_valid' => $checksumValid,
            'registry' => $registry,
        ]);
    }

    public function guide(): Response
    {
        return Inertia::render('community/guide');
    }

    public function create(): Response
    {
        return Inertia::render('community/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'nif' => ['required', 'string', 'max:9', new ValidNif],
            'legal_type' => ['required', 'in:cooperativa,asociacion,sl,slp,coop_electrica,vecinos,otro'],
            'description' => ['nullable', 'string', 'max:1000'],
            'centroid_lat' => ['required', 'numeric', 'between:-90,90'],
            'centroid_lon' => ['required', 'numeric', 'between:-180,180'],
            'max_distance_m' => ['required', 'integer', 'min:100', 'max:50000'],
            'sharing_policy' => ['required', 'in:proportional,equal,priority'],
        ]);

        // Verify the CIF corresponds to an entity type valid for energy communities.
        // Uses the free BOE/BORME open data API — no API key required.
        // Results are cached 24 h, so no extra call if the frontend already verified.
        $cif = app(CifVerificationService::class);
        $registry = $cif->lookupRegistry($data['nif']);
        if (! $registry['found'] && ! $registry['api_error']) {
            return back()->withErrors(['nif' => 'El tipo de entidad de este CIF no es válido para crear una comunidad energética. Se aceptan cooperativas, asociaciones, sociedades y comunidades de propietarios (RD 244/2019).'])->withInput();
        }

        $community = EnergyCommunity::create($data);

        $community->members()->attach($request->user()->id, [
            'role' => 'admin',
            'joined_at' => Carbon::now(),
            'sharing_coefficient' => 1,
            'status' => 'active',
        ]);

        return redirect()->route('my-community.show')
            ->with('success', "Comunidad creada. Tu código de invitación es: {$community->invite_code}");
    }
}
