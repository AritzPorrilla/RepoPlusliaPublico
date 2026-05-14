import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Copy, Settings, UserMinus, Users } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { update as myCommunityUpdate } from '@/routes/my-community';
import { remove as membersRemove } from '@/routes/my-community/members';

interface Member {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'member';
    sharing_coefficient: string;
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

function copyToClipboard(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
}

export default function MyCommunityShow({ community }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flash = props.flash;
    const [copied, setCopied] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: community.name,
        max_distance_m: String(community.max_distance_m),
        sharing_policy: community.sharing_policy,
    });

    function submitUpdate(e: React.FormEvent) {
        e.preventDefault();
        put(myCommunityUpdate().url, { preserveScroll: true });
    }

    function removeMember(member: Member) {
        if (!confirm(`¿Eliminar a ${member.name} de la comunidad?`)) { return; }
        router.delete(membersRemove(member.id).url, { preserveScroll: true });
    }

    function handleCopy() {
        copyToClipboard(community.invite_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Mi comunidad', href: '/my-community' }]}>
            <Head title={`Mi comunidad · ${community.name}`} />
            <div className="flex flex-col gap-6 p-6">

                <div>
                    <h1 className="serif text-4xl leading-tight">Mi comunidad</h1>
                    <p className="mono-label mt-1">{community.name} · {community.members.length} miembro{community.members.length !== 1 ? 's' : ''}</p>
                </div>

                {flash?.success && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--green-pluslia)', color: 'var(--ink)', border: '1px solid var(--green-deep)' }}>
                        {flash.success}
                    </div>
                )}

                {/* invite code */}
                <div
                    className="rounded-xl p-5 flex items-center justify-between"
                    style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                >
                    <div>
                        <div className="mono-label" style={{ opacity: 0.55, color: 'var(--cream)' }}>Código de invitación — compártelo para que otros se unan</div>
                        <div className="font-mono text-3xl font-bold tracking-widest mt-1">{community.invite_code}</div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
                        style={{ background: 'oklch(0.22 0.02 60)', color: 'var(--cream)' }}
                    >
                        <Copy size={15} />
                        <span className="text-sm">{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* settings */}
                    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--cream-2)' }}>
                                <Settings size={16} style={{ color: 'var(--amber-deep)' }} />
                            </div>
                            <div className="font-semibold text-sm">Configuración</div>
                        </div>
                        <form onSubmit={submitUpdate} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                <InputError message={errors.name} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="radius">Radio máximo (metros)</Label>
                                <Input id="radius" type="number" value={data.max_distance_m} onChange={(e) => setData('max_distance_m', e.target.value)} />
                                <InputError message={errors.max_distance_m} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Política de reparto</Label>
                                <Select value={data.sharing_policy} onValueChange={(v) => setData('sharing_policy', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="proportional">Proporcional</SelectItem>
                                        <SelectItem value="equal">Igual</SelectItem>
                                        <SelectItem value="priority">Prioridad</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.sharing_policy} />
                            </div>
                            <Button
                                type="submit"
                                disabled={processing}
                                style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                                className="w-fit hover:opacity-90"
                            >
                                {processing ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </form>
                    </div>

                    {/* members */}
                    <div className="flex flex-col gap-4">
                        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--cream-2)' }}>
                                    <Users size={16} style={{ color: 'var(--amber-deep)' }} />
                                </div>
                                <div className="font-semibold text-sm">Miembros ({community.members.length})</div>
                            </div>
                            <div className="flex flex-col gap-2">
                                {community.members.length === 0 ? (
                                    <p className="mono-label">Sin miembros todavía.</p>
                                ) : (
                                    community.members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                                            style={{ border: '1px solid var(--line)' }}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-[11px]"
                                                style={{ background: avatarColor(member.name), color: 'var(--cream)' }}
                                            >
                                                {initials(member.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{member.name}</span>
                                                    {member.role === 'admin' && (
                                                        <span className="pill" style={{ background: 'var(--amber)', color: 'var(--ink)' }}>Admin</span>
                                                    )}
                                                </div>
                                                <div className="mono-label">{member.email}</div>
                                            </div>
                                            {member.role !== 'admin' && (
                                                <button
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-destructive transition-colors"
                                                    onClick={() => removeMember(member)}
                                                >
                                                    <UserMinus size={15} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

MyCommunityShow.layout = () => null;
