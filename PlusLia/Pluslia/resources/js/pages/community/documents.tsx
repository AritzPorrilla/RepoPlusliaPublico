import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Download, FileText, FolderOpen, Plus, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { store as storeDocument, destroy as destroyDocument } from '@/actions/App/Http/Controllers/CommunityDocumentController';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { index as documentsIndex } from '@/routes/community/documents';

interface Document {
    id: number;
    title: string;
    description: string | null;
    file_name: string;
    file_size: number;
    mime_type: string;
    created_at: string;
    uploader: string;
}

interface Props {
    community: { id: number; name: string };
    documents: Document[];
    isAdmin: boolean;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
return `${bytes} B`;
}

    if (bytes < 1024 * 1024) {
return `${(bytes / 1024).toFixed(1)} KB`;
}

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeIcon(mime: string): string {
    if (mime === 'application/pdf') {
return '📄';
}

    if (mime.startsWith('image/')) {
return '🖼️';
}

    if (mime.includes('spreadsheet') || mime.includes('excel')) {
return '📊';
}

    if (mime.includes('word') || mime.includes('document')) {
return '📝';
}

    return '📎';
}

function DocumentRow({ doc, isAdmin }: { doc: Document; isAdmin: boolean }) {
    function deleteDoc() {
        if (!confirm(`¿Eliminar "${doc.title}"?`)) { return; }
        router.delete(destroyDocument(doc.id).url, { preserveScroll: true });
    }

    return (
        <div
            className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/30"
            style={{ borderColor: 'var(--line)' }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}
            >
                <FileText size={18} style={{ color: 'var(--amber-deep)' }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.title}</p>
                <div className="mono-label mt-0.5 truncate">
                    {doc.file_name} · {formatBytes(doc.file_size)} · {doc.uploader} · {new Date(doc.created_at).toLocaleDateString('es-ES')}
                </div>
                {doc.description && <p className="text-xs mt-0.5 opacity-60">{doc.description}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
                <Button asChild size="sm" variant="outline">
                    <a href={`/community/documents/${doc.id}/download`} download>
                        <Download size={13} />
                    </a>
                </Button>
                {isAdmin && (
                    <button
                        className="p-2 rounded-lg hover:bg-red-50 text-destructive transition-colors"
                        onClick={deleteDoc}
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

function UploadForm({ onCancel }: { onCancel: () => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        description: string;
        file: File | null;
    }>({
        title: '',
        description: '',
        file: null,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(storeDocument().url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
 reset(); onCancel(); 
},
        });
    }

    return (
        <div className="rounded-xl border border-dashed p-5" style={{ borderColor: 'var(--amber)' }}>
            <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--cream-2)' }}>
                    <Upload size={16} style={{ color: 'var(--amber-deep)' }} />
                </div>
                <span className="font-semibold text-sm">Subir documento</span>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label>Título</Label>
                    <Input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Ej: Estatutos de la comunidad" />
                    <InputError message={errors.title} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Descripción <span className="font-normal opacity-55">(opcional)</span></Label>
                    <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} />
                    <InputError message={errors.description} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Archivo <span className="font-normal opacity-55 text-xs">(PDF, Word, Excel, imágenes — máx 10 MB)</span></Label>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                        className="block w-full rounded-xl border px-3 py-2 text-sm"
                        style={{ borderColor: 'var(--line)' }}
                        onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                    />
                    <InputError message={errors.file} />
                </div>
                <div className="flex gap-2">
                    <Button type="submit" disabled={processing || !data.file} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">Subir</Button>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                </div>
            </form>
        </div>
    );
}

export default function Documents({ community, documents, isAdmin }: Props) {
    const [showForm, setShowForm] = useState(false);
    const flash = (usePage<{ flash?: { success?: string } }>().props as any).flash;

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Documentos', href: documentsIndex() }]}>
            <Head title={`Documentos · ${community.name}`} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="serif text-4xl leading-tight">Documentación</h1>
                        <p className="mono-label mt-1">{community.name} · {documents.length} archivo{documents.length !== 1 ? 's' : ''}</p>
                    </div>
                    {isAdmin && !showForm && (
                        <Button size="sm" onClick={() => setShowForm(true)} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">
                            <Plus size={13} className="mr-2" />Subir documento
                        </Button>
                    )}
                </div>

                {flash?.success && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--green-pluslia)', color: 'var(--ink)', border: '1px solid var(--green-deep)' }}>
                        {flash.success}
                    </div>
                )}

                {showForm && <UploadForm onCancel={() => setShowForm(false)} />}

                {documents.length === 0 && !showForm ? (
                    <div className="rounded-xl border border-dashed p-10 flex flex-col items-center gap-2" style={{ borderColor: 'var(--line)' }}>
                        <FolderOpen size={36} style={{ opacity: 0.3 }} />
                        <p className="font-medium">Sin documentos aún</p>
                        <p className="mono-label">
                            {isAdmin ? 'Sube los estatutos, actas o cualquier documento de la comunidad.' : 'El administrador publicará documentos aquí.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {documents.map((doc) => <DocumentRow key={doc.id} doc={doc} isAdmin={isAdmin} />)}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

Documents.layout = () => null;
