<?php

namespace App\Http\Controllers;

use App\Events\P2pOfferCreated;
use App\Models\P2pOffer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MarketplaceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $offers = P2pOffer::active()
            ->with('producer:id,name')
            ->orderBy('price_eur_kwh')
            ->get(['id', 'producer_id', 'price_eur_kwh', 'kwh_available', 'valid_until', 'status', 'created_at']);

        $myActiveOffer = $user->p2pOffers()
            ->where('status', 'active')
            ->where('valid_until', '>', now())
            ->orderByDesc('created_at')
            ->first(['id', 'price_eur_kwh', 'kwh_available', 'valid_until', 'status', 'created_at']);

        $myOffers = $user->p2pOffers()
            ->orderByDesc('created_at')
            ->get(['id', 'price_eur_kwh', 'kwh_available', 'valid_until', 'status', 'created_at']);

        $totalKwh = $offers->sum(fn ($o) => (float) $o->kwh_available);
        $avgPrice = $offers->count() > 0 ? $offers->avg(fn ($o) => (float) $o->price_eur_kwh) : null;
        $prosumerCount = $offers->unique('producer_id')->count();

        return Inertia::render('marketplace/index', [
            'offers' => $offers,
            'myOffers' => $myOffers,
            'myActiveOffer' => $myActiveOffer,
            'userId' => $user->id,
            'marketStats' => [
                'avg_price' => $avgPrice ? round((float) $avgPrice, 4) : null,
                'total_kwh' => round($totalKwh, 1),
                'prosumer_count' => $prosumerCount,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'price_eur_kwh' => ['required', 'numeric', 'min:0.01', 'max:0.99'],
            'kwh_available' => ['required', 'numeric', 'min:0.1'],
            'valid_until' => ['required', 'date', 'after:now'],
        ]);

        $offer = $request->user()->p2pOffers()->create([
            ...$data,
            'status' => 'active',
        ]);

        P2pOfferCreated::dispatch($offer);

        return back()->with('success', 'Oferta publicada correctamente.');
    }

    public function update(Request $request, P2pOffer $offer): RedirectResponse
    {
        abort_unless($offer->producer_id === $request->user()->id, 403);

        $data = $request->validate([
            'price_eur_kwh' => ['required', 'numeric', 'min:0.01', 'max:0.99'],
            'kwh_available' => ['required', 'numeric', 'min:0.1'],
        ]);

        $offer->update($data);

        return back()->with('success', 'Oferta actualizada correctamente.');
    }

    public function destroy(Request $request, P2pOffer $offer): RedirectResponse
    {
        abort_unless($offer->producer_id === $request->user()->id, 403);

        $offer->update(['status' => 'cancelled']);

        return back()->with('success', 'Oferta cancelada.');
    }
}
