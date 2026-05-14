import { Head, router } from '@inertiajs/react';
import { Crown, ShieldOff, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';

interface Community {
    id: number;
    name: string;
    invite_code: string;
}

interface Role {
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    tariff: string | null;
    contracted_power_kw: string | null;
    created_at: string;
    roles: Role[];
    communities: Community[];
    communities_count: number;
}

interface Props {
    users: User[];
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

export default function AdminUsersIndex({ users }: Props) {
    function toggleAdmin(user: User) {
        const isAdmin = user.roles.some((r) => r.name === 'admin');
        const msg = isAdmin
            ? `¿Quitar rol admin a ${user.name}?`
            : `¿Hacer administrador a ${user.name}?`;
        if (!confirm(msg)) { return; }
        router.post(`/admin/users/${user.id}/toggle-admin`, {}, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Admin', href: '/admin' }, { title: 'Usuarios', href: '/admin/users' }]}>
            <Head title="Admin · Usuarios" />
            <div className="flex flex-col gap-6 p-6">

                <div>
                    <h1 className="serif text-4xl leading-tight">Usuarios</h1>
                    <p className="mono-label mt-1">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
                </div>

                {users.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-16 flex flex-col items-center gap-3" style={{ borderColor: 'var(--line)' }}>
                        <Users size={40} style={{ opacity: 0.3 }} />
                        <p className="mono-label">No hay usuarios registrados.</p>
                    </div>
                ) : (
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
                        {/* table header */}
                        <div
                            className="grid grid-cols-[1fr_100px_160px_80px_90px_60px] gap-0 px-5 py-3"
                            style={{ background: 'var(--cream-2)', borderBottom: '1px solid var(--line)' }}
                        >
                            {['Usuario', 'Rol', 'Comunidades', 'Tarifa', 'Registro', ''].map((h) => (
                                <div key={h} className="mono-label">{h}</div>
                            ))}
                        </div>
                        {/* rows */}
                        {users.map((user, i) => {
                            const isAdmin = user.roles.some((r) => r.name === 'admin');
                            return (
                                <div
                                    key={user.id}
                                    className="grid grid-cols-[1fr_100px_160px_80px_90px_60px] gap-0 items-center px-5 py-3.5"
                                    style={{ borderBottom: i < users.length - 1 ? '1px solid var(--line)' : 'none' }}
                                >
                                    {/* user */}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-[11px]"
                                            style={{ background: avatarColor(user.name), color: 'var(--cream)' }}
                                        >
                                            {initials(user.name)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{user.name}</div>
                                            <div className="mono-label">{user.email}</div>
                                        </div>
                                    </div>
                                    {/* role */}
                                    <div>
                                        {isAdmin ? (
                                            <span className="pill" style={{ background: 'var(--amber)', color: 'var(--ink)' }}>
                                                <Crown size={9} />Admin
                                            </span>
                                        ) : (
                                            <span className="pill pill-cream">Usuario</span>
                                        )}
                                    </div>
                                    {/* communities */}
                                    <div>
                                        {user.communities.length === 0 ? (
                                            <span className="mono-label">—</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {user.communities.map((c) => (
                                                    <span key={c.id} className="pill pill-cream">{c.invite_code}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {/* tariff */}
                                    <div className="mono-label">{user.tariff ?? '—'}</div>
                                    {/* date */}
                                    <div className="mono-label">{new Date(user.created_at).toLocaleDateString('es-ES')}</div>
                                    {/* action */}
                                    <div>
                                        <button
                                            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleAdmin(user)}
                                            title={isAdmin ? 'Quitar admin' : 'Hacer admin'}
                                        >
                                            {isAdmin ? (
                                                <ShieldOff size={16} className="text-destructive" />
                                            ) : (
                                                <Crown size={16} style={{ color: 'var(--amber-deep)' }} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

AdminUsersIndex.layout = () => null;
