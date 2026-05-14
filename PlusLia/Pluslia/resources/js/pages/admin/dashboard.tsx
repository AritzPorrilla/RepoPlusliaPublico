import { Head, Link } from '@inertiajs/react';
import { Building2, Crown, Users, Zap } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as communitiesIndex, edit as communityEdit } from '@/routes/admin/communities';

interface Stats {
    communities: number;
    users: number;
    members: number;
    admins: number;
}

interface RecentCommunity {
    id: number;
    name: string;
    invite_code: string;
    sharing_policy: string;
    members_count: number;
    created_at: string;
}

interface RecentUser {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

interface Props {
    stats: Stats;
    recentCommunities: RecentCommunity[];
    recentUsers: RecentUser[];
}

const kpis = [
    { key: 'communities', label: 'Comunidades', icon: Building2 },
    { key: 'users', label: 'Usuarios', icon: Users },
    { key: 'members', label: 'Miembros activos', icon: Zap },
    { key: 'admins', label: 'Administradores', icon: Crown },
] as const;

export default function AdminDashboard({ stats, recentCommunities, recentUsers }: Props) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Admin', href: '/admin' }]}>
            <Head title="Admin · Panel" />
            <div className="flex flex-col gap-6 p-6">

                <div>
                    <h1 className="serif text-4xl leading-tight">Panel de administración</h1>
                    <p className="mono-label mt-1">Resumen global de la plataforma Pluslia</p>
                </div>

                {/* KPI cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpis.map(({ key, label, icon: Icon }) => (
                        <div key={key} className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                            <div className="flex items-start justify-between">
                                <div className="mono-label">{label}</div>
                                <Icon size={14} style={{ opacity: 0.4 }} />
                            </div>
                            <div className="serif text-4xl mt-3" style={{ color: 'var(--ink)' }}>{stats[key]}</div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* recent communities */}
                    <div className="rounded-xl border" style={{ borderColor: 'var(--line)' }}>
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
                            <h2 className="serif text-xl">Comunidades recientes</h2>
                            <Link href={communitiesIndex()} className="mono-label hover:opacity-80 transition-opacity">
                                Ver todas →
                            </Link>
                        </div>
                        <div className="flex flex-col">
                            {recentCommunities.length === 0 ? (
                                <p className="mono-label p-5">Sin comunidades todavía.</p>
                            ) : (
                                recentCommunities.map((c, i) => (
                                    <Link
                                        key={c.id}
                                        href={communityEdit(c)}
                                        className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/30"
                                        style={{ borderBottom: i < recentCommunities.length - 1 ? '1px solid var(--line)' : 'none' }}
                                    >
                                        <div>
                                            <div className="text-sm font-medium">{c.name}</div>
                                            <div className="mono-label">
                                                {c.invite_code} · {c.members_count} miembro{c.members_count !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <span className="pill pill-cream">{c.sharing_policy}</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* recent users */}
                    <div className="rounded-xl border" style={{ borderColor: 'var(--line)' }}>
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
                            <h2 className="serif text-xl">Usuarios recientes</h2>
                            <Link href="/admin/users" className="mono-label hover:opacity-80 transition-opacity">
                                Ver todos →
                            </Link>
                        </div>
                        <div className="flex flex-col">
                            {recentUsers.length === 0 ? (
                                <p className="mono-label p-5">Sin usuarios todavía.</p>
                            ) : (
                                recentUsers.map((u, i) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center justify-between px-5 py-3.5"
                                        style={{ borderBottom: i < recentUsers.length - 1 ? '1px solid var(--line)' : 'none' }}
                                    >
                                        <div>
                                            <div className="text-sm font-medium">{u.name}</div>
                                            <div className="mono-label">{u.email}</div>
                                        </div>
                                        <div className="mono-label">{new Date(u.created_at).toLocaleDateString('es-ES')}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

AdminDashboard.layout = () => null;
