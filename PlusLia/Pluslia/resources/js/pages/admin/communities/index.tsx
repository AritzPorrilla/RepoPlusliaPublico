import { Head, Link, router } from '@inertiajs/react';
import { Building2, Copy, Pencil, Plus, Trash2, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as communitiesIndex, create as communityCreate, edit as communityEdit, destroy as communityDestroy } from '@/routes/admin/communities';

interface Community {
    id: number;
    name: string;
    invite_code: string;
    centroid_lat: number;
    centroid_lon: number;
    max_distance_m: number;
    sharing_policy: string;
    members_count: number;
    created_at: string;
}

interface Props {
    communities: Community[];
}

export default function AdminCommunitiesIndex({ communities }: Props) {
    function handleDelete(community: Community) {
        if (!confirm(`¿Eliminar la comunidad "${community.name}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        router.delete(communityDestroy(community).url);
    }

    function copyCode(code: string) {
        navigator.clipboard.writeText(code);
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Admin · Comunidades', href: communitiesIndex() }]}>
            <Head title="Admin · Comunidades" />
            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="serif text-4xl leading-tight">Comunidades energéticas</h1>
                        <p className="mono-label mt-1">{communities.length} comunidad{communities.length !== 1 ? 'es' : ''} registrada{communities.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Link
                        href={communityCreate()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                        style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                    >
                        <Plus size={14} />
                        Nueva comunidad
                    </Link>
                </div>

                {communities.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-16 flex flex-col items-center gap-3" style={{ borderColor: 'var(--line)' }}>
                        <Building2 size={40} style={{ opacity: 0.3 }} />
                        <p className="mono-label">No hay comunidades creadas todavía.</p>
                        <Link
                            href={communityCreate()}
                            className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                            style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                        >
                            Crear la primera
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {communities.map((community) => (
                            <div
                                key={community.id}
                                className="rounded-xl border flex flex-col"
                                style={{ borderColor: 'var(--line)' }}
                            >
                                <div className="flex items-start justify-between p-5 pb-3">
                                    <div className="font-semibold text-sm truncate flex-1">{community.name}</div>
                                    <span className="pill pill-cream ml-2 shrink-0">{community.sharing_policy}</span>
                                </div>
                                <div className="flex flex-col gap-3 px-5 pb-5">
                                    {/* invite code */}
                                    <div
                                        className="flex items-center justify-between rounded-xl px-3 py-2"
                                        style={{ background: 'var(--cream-2)' }}
                                    >
                                        <span className="font-mono text-sm font-bold tracking-widest">{community.invite_code}</span>
                                        <button
                                            className="p-1 rounded hover:opacity-70 transition-opacity"
                                            onClick={() => copyCode(community.invite_code)}
                                            title="Copiar código"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1 mono-label">
                                        <span>Lat: {Number(community.centroid_lat).toFixed(4)}</span>
                                        <span>Lon: {Number(community.centroid_lon).toFixed(4)}</span>
                                        <span>Radio: {community.max_distance_m / 1000} km</span>
                                        <span className="flex items-center gap-1">
                                            <Users size={10} />
                                            {community.members_count} miembro{community.members_count !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 mt-auto pt-1">
                                        <Link
                                            href={communityEdit(community)}
                                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-sm hover:bg-muted/30 transition-colors"
                                            style={{ borderColor: 'var(--line)' }}
                                        >
                                            <Pencil size={12} />Editar
                                        </Link>
                                        <button
                                            className="p-1.5 rounded-xl hover:bg-red-50 text-destructive transition-colors"
                                            style={{ border: '1px solid var(--line)' }}
                                            onClick={() => handleDelete(community)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

AdminCommunitiesIndex.layout = () => null;
