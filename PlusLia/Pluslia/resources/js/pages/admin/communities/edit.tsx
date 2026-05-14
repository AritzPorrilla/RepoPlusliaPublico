import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Copy, UserMinus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import {
    index as communitiesIndex,
    update as communityUpdate,
} from '@/routes/admin/communities';
import { store as memberStore, destroy as memberDestroy } from '@/routes/admin/communities/members';

interface Member {
    id: number;
    name: string;
    email: string;
}

interface Community {
    id: number;
    name: string;
    invite_code: string;
    centroid_lat: number;
    centroid_lon: number;
    max_distance_m: number;
    sharing_policy: string;
    members: Member[];
}

interface Props {
    community: Community;
    availableUsers: Member[];
}

function initials(name: string) {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
    const hues = [30, 65, 120, 180, 235, 280, 320];
    let h = 0;
    for (let i = 0; i < name.length; i++) { h = (h + name.charCodeAt(i)) % hues.length; }
    return `oklch(0.72 0.12 ${hues[h]})`;
}

export default function AdminCommunityEdit({ community, availableUsers }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flash = props.flash;

    const { data, setData, put, processing, errors } = useForm({
        name: community.name,
        centroid_lat: String(community.centroid_lat),
        centroid_lon: String(community.centroid_lon),
        max_distance_m: String(community.max_distance_m),
        sharing_policy: community.sharing_policy,
    });

    const [selectedUserId, setSelectedUserId] = useState('');
    const [sharingCoefficient, setSharingCoefficient] = useState('1');

    function submitUpdate(e: React.FormEvent) {
        e.preventDefault();
        put(communityUpdate(community).url);
    }

    function addMember(e: React.FormEvent) {
        e.preventDefault();
        router.post(memberStore(community).url, {
            user_id: selectedUserId,
            sharing_coefficient: sharingCoefficient,
        }, {
            preserveScroll: true,
            onSuccess: () => { setSelectedUserId(''); setSharingCoefficient('1'); },
        });
    }

    function removeMember(member: Member) {
        if (!confirm(`¿Eliminar a ${member.name} de la comunidad?`)) { return; }
        router.delete(memberDestroy({ community: community.id, user: member.id }).url, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Admin · Comunidades', href: communitiesIndex() }, { title: 'Editar', href: '' }]}>
            <Head title={`Editar · ${community.name}`} />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="serif text-4xl leading-tight">Editar comunidad</h1>
                    <p className="mono-label mt-1">{community.name}</p>
                </div>

                {flash?.success && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--green-pluslia)', color: 'var(--ink)', border: '1px solid var(--green-deep)' }}>
                        {flash.success}
                    </div>
                )}

                {/* Invite code banner */}
                <div
                    className="flex items-center justify-between rounded-xl px-5 py-4"
                    style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                >
                    <div>
                        <div className="mono-label" style={{ color: 'var(--cream)', opacity: 0.55 }}>Código de invitación</div>
                        <div className="font-mono text-2xl font-bold tracking-widest mt-1">{community.invite_code}</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(community.invite_code)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-opacity hover:opacity-80"
                        style={{ background: 'oklch(0.22 0.02 60)', color: 'var(--cream)' }}
                    >
                        <Copy size={13} />Copiar
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Edit form */}
                    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                        <div className="font-semibold text-sm mb-4">Datos generales</div>
                        <form onSubmit={submitUpdate} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="centroid_lat">Latitud</Label>
                                    <Input
                                        id="centroid_lat"
                                        type="number"
                                        step="any"
                                        value={data.centroid_lat}
                                        onChange={(e) => setData('centroid_lat', e.target.value)}
                                    />
                                    <InputError message={errors.centroid_lat} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="centroid_lon">Longitud</Label>
                                    <Input
                                        id="centroid_lon"
                                        type="number"
                                        step="any"
                                        value={data.centroid_lon}
                                        onChange={(e) => setData('centroid_lon', e.target.value)}
                                    />
                                    <InputError message={errors.centroid_lon} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="max_distance_m">Radio máximo (metros)</Label>
                                <Input
                                    id="max_distance_m"
                                    type="number"
                                    value={data.max_distance_m}
                                    onChange={(e) => setData('max_distance_m', e.target.value)}
                                />
                                <InputError message={errors.max_distance_m} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Política de reparto</Label>
                                <Select value={data.sharing_policy} onValueChange={(v) => setData('sharing_policy', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="proportional">Proporcional</SelectItem>
                                        <SelectItem value="equal">Igual</SelectItem>
                                        <SelectItem value="priority">Prioridad</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.sharing_policy} />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={processing} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">
                                    {processing ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={communitiesIndex()}>Volver</Link>
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Members management */}
                    <div className="flex flex-col gap-4">
                        {/* Members list */}
                        <div className="rounded-xl border" style={{ borderColor: 'var(--line)' }}>
                            <div className="px-5 py-4 font-semibold text-sm" style={{ borderBottom: '1px solid var(--line)' }}>
                                Miembros ({community.members.length})
                            </div>
                            <div className="flex flex-col">
                                {community.members.length === 0 ? (
                                    <p className="mono-label p-5">Sin miembros todavía.</p>
                                ) : (
                                    community.members.map((member, i) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between px-5 py-3"
                                            style={{ borderBottom: i < community.members.length - 1 ? '1px solid var(--line)' : 'none' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-[11px]"
                                                    style={{ background: avatarColor(member.name), color: 'var(--cream)' }}
                                                >
                                                    {initials(member.name)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{member.name}</div>
                                                    <div className="mono-label">{member.email}</div>
                                                </div>
                                            </div>
                                            <button
                                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                onClick={() => removeMember(member)}
                                                title="Eliminar miembro"
                                            >
                                                <UserMinus size={15} className="text-destructive" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Add member form */}
                        {availableUsers.length > 0 && (
                            <div
                                className="rounded-xl border-2 border-dashed p-5"
                                style={{ borderColor: 'var(--amber)' }}
                            >
                                <div className="font-semibold text-sm mb-4">Añadir miembro</div>
                                <form onSubmit={addMember} className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label>Usuario</Label>
                                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un usuario..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableUsers.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>
                                                        {u.name} — {u.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="coef">Coeficiente de reparto (0–1)</Label>
                                        <Input
                                            id="coef"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={sharingCoefficient}
                                            onChange={(e) => setSharingCoefficient(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={!selectedUserId}
                                        style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                                        className="hover:opacity-90"
                                    >
                                        <UserPlus size={14} className="mr-2" />
                                        Añadir
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

AdminCommunityEdit.layout = () => null;
