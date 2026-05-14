<?php

namespace App\Http\Controllers;

use App\Models\CommunityFee;
use App\Models\EnergyCommunity;
use App\Models\MemberPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityFeeController extends Controller
{
    private function getCommunity(Request $request): EnergyCommunity
    {
        $community = $request->user()->administeredCommunities()->firstOrFail();
        abort_unless($request->user()->isCommunityAdminOf($community), 403);

        return $community;
    }

    public function index(Request $request): Response
    {
        $community = $this->getCommunity($request);

        $members = $community->members()->select('users.id', 'users.name', 'users.email')->get();

        $fees = $community->fees()
            ->with(['payments' => fn ($q) => $q->with('user:id,name')])
            ->get()
            ->map(fn ($fee) => [
                'id' => $fee->id,
                'title' => $fee->title,
                'description' => $fee->description,
                'amount_eur' => (float) $fee->amount_eur,
                'frequency' => $fee->frequency,
                'frequency_label' => $fee->frequencyLabel(),
                'active' => $fee->active,
                'payments' => $fee->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'user_id' => $p->user_id,
                    'user_name' => $p->user->name,
                    'amount_eur' => (float) $p->amount_eur,
                    'status' => $p->status,
                    'paid_at' => $p->paid_at?->toIso8601String(),
                    'period' => $p->period,
                ]),
            ]);

        return Inertia::render('community/fees', [
            'community' => ['id' => $community->id, 'name' => $community->name],
            'fees' => $fees,
            'members' => $members->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'email' => $m->email]),
        ]);
    }

    public function storeFee(Request $request): RedirectResponse
    {
        $community = $this->getCommunity($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'amount_eur' => ['required', 'numeric', 'min:0.01', 'max:99999'],
            'frequency' => ['required', 'in:one_time,monthly,annual'],
        ]);

        $fee = $community->fees()->create($data);

        // Create pending payments for all current members
        $period = match ($data['frequency']) {
            'monthly' => now()->format('Y-m'),
            'annual' => now()->format('Y'),
            default => null,
        };

        $community->members()->each(function ($member) use ($fee, $period) {
            $fee->payments()->create([
                'user_id' => $member->id,
                'amount_eur' => $fee->amount_eur,
                'status' => 'pending',
                'period' => $period,
            ]);
        });

        return back()->with('success', 'Cuota creada y asignada a todos los socios.');
    }

    public function markPaid(Request $request, CommunityFee $fee, int $userId): RedirectResponse
    {
        $community = $this->getCommunity($request);
        abort_unless($fee->community_id === $community->id, 403);

        $payment = $fee->payments()->where('user_id', $userId)->firstOrFail();
        $payment->update(['status' => 'paid', 'paid_at' => now()]);

        return back()->with('success', 'Pago registrado.');
    }

    public function markUnpaid(Request $request, CommunityFee $fee, int $userId): RedirectResponse
    {
        $community = $this->getCommunity($request);
        abort_unless($fee->community_id === $community->id, 403);

        $payment = $fee->payments()->where('user_id', $userId)->firstOrFail();
        $payment->update(['status' => 'pending', 'paid_at' => null]);

        return back()->with('success', 'Pago marcado como pendiente.');
    }

    public function destroyFee(Request $request, CommunityFee $fee): RedirectResponse
    {
        $community = $this->getCommunity($request);
        abort_unless($fee->community_id === $community->id, 403);

        $fee->delete();

        return back()->with('success', 'Cuota eliminada.');
    }
}
