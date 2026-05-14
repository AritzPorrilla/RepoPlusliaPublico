<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceTask;
use App\Models\PriceTick;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $last30Days = $user->dailyAggregates()
            ->where('day', '>=', now()->subDays(30)->toDateString())
            ->orderBy('day')
            ->get(['day', 'produced_kwh', 'consumed_kwh', 'grid_exported_kwh', 'grid_imported_kwh']);

        $lastSettlement = $user->monthlySettlements()
            ->orderByDesc('month')
            ->first();

        $currentPrice = PriceTick::where('source', 'pvpc')
            ->orderByDesc('recorded_at')
            ->first(['price_eur_kwh', 'recorded_at']);

        $hourlyPvpc = PriceTick::where('source', 'pvpc')
            ->whereDate('recorded_at', now()->toDateString())
            ->orderBy('recorded_at')
            ->get(['price_eur_kwh', 'recorded_at'])
            ->map(fn ($t) => [
                'hour' => (int) $t->recorded_at->format('G'),
                'price' => (float) $t->price_eur_kwh,
            ])
            ->values();

        $community = $user->communities()->withPivot('role')->first();

        $members = $community
            ? $community->members()
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
                ->values()
            : collect();

        $upcomingTasks = $community
            ? MaintenanceTask::where('community_id', $community->id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->whereNotNull('scheduled_at')
                ->whereBetween('scheduled_at', [now()->toDateString(), now()->addDays(7)->toDateString()])
                ->orderBy('scheduled_at')
                ->get(['id', 'title', 'scheduled_at', 'status'])
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'scheduled_at' => $t->scheduled_at->toDateString(),
                    'status' => $t->status,
                ])
            : collect();

        return Inertia::render('dashboard', [
            'dailyData' => $last30Days,
            'lastSettlement' => $lastSettlement,
            'currentPvpc' => $currentPrice ? (float) $currentPrice->price_eur_kwh : null,
            'pvpcUpdatedAt' => $currentPrice ? $currentPrice->recorded_at->toIso8601String() : null,
            'hourlyPvpc' => $hourlyPvpc,
            'community' => $community ? [
                'id' => $community->id,
                'name' => $community->name,
                'invite_code' => $community->invite_code,
                'centroid_lat' => (float) $community->centroid_lat,
                'centroid_lon' => (float) $community->centroid_lon,
                'userRole' => $community->pivot->role,
            ] : null,
            'members' => $members,
            'hasAddress' => $user->address()->exists(),
            'userType' => $user->user_type ?? 'consumer',
            'upcomingTasks' => $upcomingTasks->values(),
        ]);
    }
}
