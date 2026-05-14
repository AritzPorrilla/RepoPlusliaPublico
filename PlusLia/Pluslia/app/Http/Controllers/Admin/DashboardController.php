<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EnergyCommunity;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render("admin/dashboard", [
            "stats" => [
                "communities" => EnergyCommunity::count(),
                "users" => User::count(),
                "members" => DB::table("community_user")->count(),
                "admins" => User::role("admin")->count(),
            ],
            "recentCommunities" => EnergyCommunity::withCount("members")
                ->latest()
                ->limit(5)
                ->get(["id", "name", "invite_code", "sharing_policy", "created_at"]),
            "recentUsers" => User::latest()
                ->limit(5)
                ->get(["id", "name", "email", "created_at"]),
        ]);
    }
}
