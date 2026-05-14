<?php

namespace App\Http\Controllers;

use App\Models\EnergyCommunity;
use App\Models\MaintenanceTask;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceTaskController extends Controller
{
    private function getCommunity(Request $request): EnergyCommunity
    {
        return $request->user()->communities()->firstOrFail();
    }

    public function index(Request $request): Response
    {
        $community = $this->getCommunity($request);
        $isAdmin = $request->user()->isCommunityAdminOf($community);

        $tasks = $community->maintenanceTasks()
            ->with(['creator:id,name', 'assignee:id,name'])
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END")
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'type' => $t->type,
                'status' => $t->status,
                'scheduled_at' => $t->scheduled_at?->toDateString(),
                'completed_at' => $t->completed_at?->toIso8601String(),
                'created_at' => $t->created_at->toIso8601String(),
                'creator' => $t->creator->name,
                'assignee' => $t->assignee?->name,
            ]);

        $members = $community->members()->select('users.id', 'users.name')->get()
            ->map(fn ($m) => ['id' => $m->id, 'name' => $m->name]);

        return Inertia::render('community/maintenance', [
            'community' => ['id' => $community->id, 'name' => $community->name],
            'tasks' => $tasks,
            'members' => $members,
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
            'type' => ['required', 'in:preventive,corrective'],
            'scheduled_at' => ['nullable', 'date'],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $community->maintenanceTasks()->create([
            'created_by' => $request->user()->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'],
            'status' => 'pending',
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'assigned_to' => $data['assigned_to'] ?? null,
        ]);

        return back()->with('success', 'Tarea de mantenimiento creada.');
    }

    public function update(Request $request, MaintenanceTask $task): RedirectResponse
    {
        $community = $this->getCommunity($request);
        abort_unless($task->community_id === $community->id, 403);
        abort_unless($request->user()->isCommunityAdminOf($community), 403);

        $data = $request->validate([
            'status' => ['required', 'in:pending,in_progress,done'],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $task->update([
            'status' => $data['status'],
            'assigned_to' => $data['assigned_to'] ?? $task->assigned_to,
            'completed_at' => $data['status'] === 'done' ? now() : null,
        ]);

        return back()->with('success', 'Tarea actualizada.');
    }

    public function destroy(Request $request, MaintenanceTask $task): RedirectResponse
    {
        $community = $this->getCommunity($request);
        abort_unless($task->community_id === $community->id, 403);
        abort_unless($request->user()->isCommunityAdminOf($community), 403);

        $task->delete();

        return back()->with('success', 'Tarea eliminada.');
    }
}
