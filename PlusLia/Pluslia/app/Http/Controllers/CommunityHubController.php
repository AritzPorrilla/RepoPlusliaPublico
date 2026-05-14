<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\CommunityMessage;
use App\Models\EnergyCommunity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityHubController extends Controller
{
    private function getCommunity(Request $request): EnergyCommunity
    {
        return $request->user()->communities()->firstOrFail();
    }

    public function show(Request $request): Response
    {
        $community = $this->getCommunity($request);

        $messages = $community->messages()
            ->with('user:id,name')
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->map(fn ($m) => [
                'id' => $m->id,
                'body' => $m->body,
                'created_at' => $m->created_at->toIso8601String(),
                'user' => ['id' => $m->user->id, 'name' => $m->user->name],
                'is_mine' => $m->user_id === $request->user()->id,
            ])
            ->values();

        return Inertia::render('community/chat', [
            'community' => ['id' => $community->id, 'name' => $community->name],
            'messages' => $messages,
        ]);
    }

    public function sendMessage(Request $request): RedirectResponse
    {
        $community = $this->getCommunity($request);

        $request->validate(['body' => ['required', 'string', 'max:1000']]);

        $message = $community->messages()->create([
            'user_id' => $request->user()->id,
            'body' => $request->body,
        ]);

        $message->load('user:id,name');
        MessageSent::dispatch($message);

        return back();
    }
}
