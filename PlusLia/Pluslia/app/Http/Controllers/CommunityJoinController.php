<?php

namespace App\Http\Controllers;

use App\Models\EnergyCommunity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CommunityJoinController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $request->validate([
            'invite_code' => ['required', 'string', 'size:8'],
        ]);

        $community = EnergyCommunity::where('invite_code', strtoupper($request->invite_code))->first();

        if (! $community) {
            return back()->withErrors(['invite_code' => 'Código de invitación no válido.']);
        }

        $user = $request->user();

        if ($user->communities()->exists()) {
            return back()->withErrors(['invite_code' => 'Ya perteneces a una comunidad. Solo puedes estar en una a la vez.']);
        }

        $community->members()->attach($user->id, [
            'role' => 'member',
            'joined_at' => Carbon::now(),
            'sharing_coefficient' => 1,
            'status' => 'active',
        ]);

        return redirect()->route('dashboard')
            ->with('success', "Te has unido a la comunidad \"{$community->name}\".");
    }
}
