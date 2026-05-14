<?php

namespace App\Http\Controllers;

use App\Models\CommunityDocument;
use App\Models\EnergyCommunity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CommunityDocumentController extends Controller
{
    private function getCommunity(Request $request): EnergyCommunity
    {
        return $request->user()->communities()->firstOrFail();
    }

    public function index(Request $request): Response
    {
        $community = $this->getCommunity($request);
        $isAdmin = $request->user()->isCommunityAdminOf($community);

        $documents = $community->documents()
            ->with('uploader:id,name')
            ->latest()
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'title' => $d->title,
                'description' => $d->description,
                'file_name' => $d->file_name,
                'file_size' => $d->file_size,
                'mime_type' => $d->mime_type,
                'created_at' => $d->created_at->toIso8601String(),
                'uploader' => $d->uploader->name,
            ]);

        return Inertia::render('community/documents', [
            'community' => ['id' => $community->id, 'name' => $community->name],
            'documents' => $documents,
            'isAdmin' => $isAdmin,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $community = $this->getCommunity($request);
        abort_unless($request->user()->isCommunityAdminOf($community), 403);

        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,doc,docx,xls,xlsx,png,jpg,jpeg,txt'],
        ]);

        $file = $request->file('file');
        $path = $file->store("communities/{$community->id}/documents", 'local');

        $community->documents()->create([
            'uploaded_by' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ]);

        return back()->with('success', 'Documento subido correctamente.');
    }

    public function download(Request $request, CommunityDocument $document): mixed
    {
        $community = $this->getCommunity($request);
        abort_unless($document->community_id === $community->id, 403);

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }

    public function destroy(Request $request, CommunityDocument $document): RedirectResponse
    {
        $community = $this->getCommunity($request);
        abort_unless($document->community_id === $community->id, 403);
        abort_unless($request->user()->isCommunityAdminOf($community), 403);

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return back()->with('success', 'Documento eliminado.');
    }
}
