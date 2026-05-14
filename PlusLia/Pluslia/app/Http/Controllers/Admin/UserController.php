<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::with("roles", "communities:id,name,invite_code")
            ->withCount("communities")
            ->latest()
            ->get(["id", "name", "email", "tariff", "contracted_power_kw", "created_at"]);

        return Inertia::render("admin/users/index", [
            "users" => $users,
        ]);
    }

    public function toggleAdmin(User $user): RedirectResponse
    {
        if ($user->hasRole("admin")) {
            $user->removeRole("admin");
            $message = "Rol admin eliminado de {$user->name}.";
        } else {
            $user->assignRole("admin");
            $message = "{$user->name} es ahora administrador.";
        }

        return back()->with("success", $message);
    }
}
