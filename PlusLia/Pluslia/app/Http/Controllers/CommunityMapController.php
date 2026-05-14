<?php

namespace App\Http\Controllers;

use App\Models\PriceTick;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityMapController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $community = $user->communities()->first();

        $pvpcPrice = PriceTick::where('source', 'pvpc')
            ->latest('recorded_at')
            ->value('price_eur_kwh');

        if (! $community) {
            return Inertia::render('map', [
                'community' => null,
                'members' => [],
                'pvpcPrice' => $pvpcPrice ? round((float) $pvpcPrice, 4) : null,
            ]);
        }

        $members = $community->members()
            ->with('address:id,user_id,lat,lon,peak_power_kwp')
            ->get(['users.id', 'users.name'])
            ->map(fn ($member) => [
                'id' => $member->id,
                'name' => $member->name,
                'lat' => $member->address ? (float) $member->address->lat : null,
                'lon' => $member->address ? (float) $member->address->lon : null,
                'peak_power_kwp' => $member->address ? (float) $member->address->peak_power_kwp : null,
                'is_me' => $member->id === $user->id,
            ])
            ->filter(fn ($m) => $m['lat'] !== null)
            ->values();

        return Inertia::render('map', [
            'community' => [
                'id' => $community->id,
                'name' => $community->name,
                'centroid_lat' => (float) $community->centroid_lat,
                'centroid_lon' => (float) $community->centroid_lon,
            ],
            'members' => $members,
            'pvpcPrice' => $pvpcPrice ? round((float) $pvpcPrice, 4) : null,
        ]);
    }
}
