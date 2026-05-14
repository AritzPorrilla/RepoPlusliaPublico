<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'isAdmin' => $request->user()?->hasRole('admin') ?? false,
                'isCommunityAdmin' => $request->user()
                    ? $request->user()->administeredCommunities()->exists()
                    : false,
                'isCommunityMember' => $request->user()
                    ? $request->user()->communities()->exists()
                    : false,
            ],
            'community' => function () use ($request) {
                if (! $request->user()) {
                    return null;
                }

                $community = $request->user()->communities()->withCount('members')->first();

                return $community ? [
                    'name' => $community->name,
                    'invite_code' => $community->invite_code,
                    'members_count' => $community->members_count,
                ] : null;
            },
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
