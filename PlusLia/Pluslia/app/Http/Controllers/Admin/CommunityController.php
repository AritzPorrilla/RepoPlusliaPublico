<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EnergyCommunity;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    public function index(): Response
    {
        $communities = EnergyCommunity::withCount("members")->latest()->get();

        return Inertia::render("admin/communities/index", [
            "communities" => $communities,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render("admin/communities/create");
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            "name" => ["required", "string", "max:255"],
            "centroid_lat" => ["required", "numeric", "between:-90,90"],
            "centroid_lon" => ["required", "numeric", "between:-180,180"],
            "max_distance_m" => ["required", "integer", "min:100", "max:50000"],
            "sharing_policy" => ["required", "in:proportional,equal,priority"],
        ]);

        $community = EnergyCommunity::create($data);

        return redirect()->route("admin.communities.edit", $community)
            ->with("success", "Comunidad creada. Código de invitación: {$community->invite_code}");
    }

    public function edit(EnergyCommunity $community): Response
    {
        $community->load(["members:users.id,users.name,users.email"]);

        $availableUsers = User::whereDoesntHave("communities", fn ($q) => $q->where("energy_communities.id", $community->id))
            ->select("id", "name", "email")
            ->orderBy("name")
            ->get();

        return Inertia::render("admin/communities/edit", [
            "community" => $community,
            "availableUsers" => $availableUsers,
        ]);
    }

    public function update(Request $request, EnergyCommunity $community): RedirectResponse
    {
        $data = $request->validate([
            "name" => ["required", "string", "max:255"],
            "centroid_lat" => ["required", "numeric", "between:-90,90"],
            "centroid_lon" => ["required", "numeric", "between:-180,180"],
            "max_distance_m" => ["required", "integer", "min:100", "max:50000"],
            "sharing_policy" => ["required", "in:proportional,equal,priority"],
        ]);

        $community->update($data);

        return redirect()->route("admin.communities.edit", $community)->with("success", "Comunidad actualizada.");
    }

    public function destroy(EnergyCommunity $community): RedirectResponse
    {
        $community->delete();

        return redirect()->route("admin.communities.index")->with("success", "Comunidad eliminada.");
    }
}
