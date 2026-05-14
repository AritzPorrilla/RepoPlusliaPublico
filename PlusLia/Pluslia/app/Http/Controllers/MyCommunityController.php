<?php

namespace App\Http\Controllers;

use App\Models\EnergyCommunity;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class MyCommunityController extends Controller
{
    private function getCommunityForAdmin(Request $request): EnergyCommunity
    {
        $community = $request->user()->administeredCommunities()->firstOrFail();

        return $community;
    }

    public function show(Request $request): Response
    {
        $community = $this->getCommunityForAdmin($request);
        $community->load(['members:users.id,users.name,users.email']);

        $members = $community->members->map(fn ($m) => [
            'id' => $m->id,
            'name' => $m->name,
            'email' => $m->email,
            'role' => $m->pivot->role,
            'joined_at' => $m->pivot->joined_at,
            'sharing_coefficient' => $m->pivot->sharing_coefficient,
        ]);

        return Inertia::render('my-community/show', [
            'community' => [
                'id' => $community->id,
                'name' => $community->name,
                'invite_code' => $community->invite_code,
                'centroid_lat' => (float) $community->centroid_lat,
                'centroid_lon' => (float) $community->centroid_lon,
                'max_distance_m' => $community->max_distance_m,
                'sharing_policy' => $community->sharing_policy,
                'members' => $members,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $community = $this->getCommunityForAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'max_distance_m' => ['required', 'integer', 'min:100', 'max:50000'],
            'sharing_policy' => ['required', 'in:proportional,equal,priority'],
        ]);

        $community->update($data);

        return back()->with('success', 'Comunidad actualizada correctamente.');
    }

    public function addMember(Request $request): RedirectResponse
    {
        $community = $this->getCommunityForAdmin($request);

        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'sharing_coefficient' => ['required', 'numeric', 'min:0', 'max:1'],
        ]);

        if ($community->members()->where('users.id', $request->user_id)->exists()) {
            return back()->withErrors(['user_id' => 'El usuario ya es miembro de esta comunidad.']);
        }

        $community->members()->attach($request->user_id, [
            'role' => 'member',
            'joined_at' => Carbon::now(),
            'sharing_coefficient' => $request->sharing_coefficient,
            'status' => 'active',
        ]);

        return back()->with('success', 'Miembro añadido correctamente.');
    }

    public function removeMember(Request $request, User $user): RedirectResponse
    {
        $community = $this->getCommunityForAdmin($request);
        $community->members()->detach($user->id);

        return back()->with('success', 'Miembro eliminado de la comunidad.');
    }
}
