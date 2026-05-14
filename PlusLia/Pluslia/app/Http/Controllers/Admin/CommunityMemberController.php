<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EnergyCommunity;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CommunityMemberController extends Controller
{
    public function store(Request $request, EnergyCommunity $community): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'sharing_coefficient' => ['required', 'numeric', 'min:0', 'max:1'],
        ]);

        if ($community->members()->where('users.id', $data['user_id'])->exists()) {
            return back()->withErrors(['user_id' => 'El usuario ya pertenece a esta comunidad.']);
        }

        $community->members()->attach($data['user_id'], [
            'joined_at' => now(),
            'sharing_coefficient' => $data['sharing_coefficient'],
            'status' => 'active',
        ]);

        return back()->with('success', 'Miembro añadido correctamente.');
    }

    public function destroy(EnergyCommunity $community, User $user): RedirectResponse
    {
        $community->members()->detach($user->id);

        return back()->with('success', 'Miembro eliminado de la comunidad.');
    }
}
