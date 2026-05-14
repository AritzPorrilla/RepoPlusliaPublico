<?php

namespace App\Http\Controllers;

use App\Models\CommunityPoll;
use App\Models\EnergyCommunity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityPollController extends Controller
{
    private function getCommunity(Request $request): EnergyCommunity
    {
        return $request->user()->communities()->firstOrFail();
    }

    public function index(Request $request): Response
    {
        $community = $this->getCommunity($request);
        $userId = $request->user()->id;
        $isAdmin = $request->user()->isCommunityAdminOf($community);

        $polls = $community->polls()
            ->with(['options.votes', 'author:id,name'])
            ->latest()
            ->get()
            ->map(fn ($poll) => $this->formatPoll($poll, $userId));

        return Inertia::render('community/polls', [
            'community' => ['id' => $community->id, 'name' => $community->name],
            'polls' => $polls,
            'isAdmin' => $isAdmin,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $community = $this->getCommunity($request);
        abort_unless($request->user()->isCommunityAdminOf($community), 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => ['required', 'in:yes_no,multiple'],
            'closes_at' => ['nullable', 'date', 'after:now'],
            'options' => ['required_if:type,multiple', 'array', 'min:2', 'max:8'],
            'options.*' => ['required', 'string', 'max:200'],
        ]);

        $poll = $community->polls()->create([
            'created_by' => $request->user()->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'],
            'closes_at' => $data['closes_at'] ?? null,
            'status' => 'open',
        ]);

        if ($data['type'] === 'yes_no') {
            $poll->options()->createMany([
                ['text' => 'Sí', 'position' => 0],
                ['text' => 'No', 'position' => 1],
            ]);
        } else {
            foreach ($data['options'] as $i => $text) {
                $poll->options()->create(['text' => $text, 'position' => $i]);
            }
        }

        return back()->with('success', 'Votación creada correctamente.');
    }

    public function vote(Request $request, CommunityPoll $poll): RedirectResponse
    {
        $community = $this->getCommunity($request);
        abort_unless($poll->community_id === $community->id, 403);
        abort_unless($poll->isOpen(), 422);
        abort_if($poll->hasVoted($request->user()->id), 422);

        $request->validate(['option_id' => ['required', 'exists:poll_options,id']]);

        abort_unless($poll->options()->where('id', $request->option_id)->exists(), 422);

        $poll->votes()->create([
            'option_id' => $request->option_id,
            'user_id' => $request->user()->id,
        ]);

        return back()->with('success', 'Voto registrado.');
    }

    public function close(Request $request, CommunityPoll $poll): RedirectResponse
    {
        $community = $this->getCommunity($request);
        abort_unless($poll->community_id === $community->id, 403);
        abort_unless($request->user()->isCommunityAdminOf($community), 403);

        $poll->update(['status' => 'closed']);

        return back()->with('success', 'Votación cerrada.');
    }

    /** @return array<string, mixed> */
    private function formatPoll(CommunityPoll $poll, int $userId): array
    {
        $totalVotes = $poll->votes->count();
        $userVoteOptionId = $poll->votes->where('user_id', $userId)->first()?->option_id;

        return [
            'id' => $poll->id,
            'title' => $poll->title,
            'description' => $poll->description,
            'type' => $poll->type,
            'status' => $poll->status,
            'is_open' => $poll->isOpen(),
            'closes_at' => $poll->closes_at?->toIso8601String(),
            'created_at' => $poll->created_at->toIso8601String(),
            'author' => $poll->author->name,
            'total_votes' => $totalVotes,
            'has_voted' => $userVoteOptionId !== null,
            'user_vote_option_id' => $userVoteOptionId,
            'options' => $poll->options->map(fn ($opt) => [
                'id' => $opt->id,
                'text' => $opt->text,
                'votes' => $opt->votes->count(),
                'percentage' => $totalVotes > 0 ? round($opt->votes->count() / $totalVotes * 100) : 0,
            ]),
        ];
    }
}
