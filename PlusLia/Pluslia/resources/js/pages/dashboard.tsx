import { Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import { AlertTriangle, Battery, BookOpen, Plus, Settings, Sun, TrendingDown, TrendingUp, Users, Wrench, Zap } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipValueType } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { index as maintenanceIndex } from '@/routes/community/maintenance';
import { show as onboardingShow } from '@/routes/onboarding';
import type { Community, CommunityMember, DailyAggregate, MonthlySettlement } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface UpcomingTask { id: number; title: string; scheduled_at: string; status: string; }
interface HourlyPvpc { hour: number; price: number; }

interface Props {
    dailyData: DailyAggregate[];
    lastSettlement: MonthlySettlement | null;
    currentPvpc: number | null;
    pvpcUpdatedAt: string | null;
    hourlyPvpc: HourlyPvpc[];
    community: (Community & { invite_code: string; userRole: 'admin' | 'member' }) | null;
    members: CommunityMember[];
    hasAddress: boolean;
    userType: 'consumer' | 'prosumer';
    upcomingTasks: UpcomingTask[];
}

function PvpcBars({ hours }: { hours: HourlyPvpc[] }) {
    if (hours.length === 0) return null;
    const prices = hours.map((h) => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 0.001;
    const current = new Date().getHours();

    function band(p: number) {
        const pct = (p - min) / range;
        if (pct < 0.34) return 'barato';
        if (pct < 0.67) return 'medio';
        return 'caro';
    }

    const colors: Record<string, string> = {
        barato: 'oklch(0.68 0.15 145)',
        medio: 'var(--amber)',
        caro: 'oklch(0.62 0.2 25)',
    };

    const maxH = 36;

    return (
        <div className="mt-4">
            <div className="flex items-end gap-0.5" style={{ height: maxH + 4 }}>
                {Array.from({ length: 24 }, (_, h) => {
                    const tick = hours.find((x) => x.hour === h);
                    const p = tick?.price ?? 0;
                    const b = band(p);
                    const barH = tick ? Math.max(4, Math.round(((p - min) / range) * maxH) + 4) : 4;
                    const isNow = h === current;
                    return (
                        <div
                            key={h}
                            style={{
                                flex: 1,
                                height: barH,
                                background: tick ? colors[b] : 'var(--line)',
                                borderRadius: 2,
                                opacity: isNow ? 1 : 0.7,
                                outline: isNow ? '1.5px solid var(--ink)' : 'none',
                            }}
                            title={tick ? `${h}h · ${p.toFixed(4)} €/kWh · ${b}` : `${h}h · sin dato`}
                        />
                    );
                })}
            </div>
            <div className="mt-2 flex gap-4 font-mono text-[10px]" style={{ opacity: 0.65 }}>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: colors.barato }} /> Barato</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: colors.medio }} /> Medio</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: colors.caro }} /> Caro</span>
            </div>
        </div>
    );
}

function CommunityMap({ community, members }: { community: Community | null; members: CommunityMember[] }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current || members.length === 0) return;
        import('leaflet').then((L) => {
            import('leaflet/dist/leaflet.css');
            const center: [number, number] = community?.centroid_lat && community?.centroid_lon
                ? [community.centroid_lat, community.centroid_lon]
                : [members[0].lat, members[0].lon];
            const instance = L.map(mapRef.current!).setView(center, 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(instance);
            instance.whenReady(() => { instance.invalidateSize(); window.setTimeout(() => instance.invalidateSize(), 150); });
            members.forEach((m) => {
                const icon = L.divIcon({
                    html: `<div style="background:${m.is_me ? 'var(--ink)' : 'var(--amber)'};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
                    className: '', iconSize: [12, 12], iconAnchor: [6, 6],
                });
                L.marker([m.lat, m.lon], { icon }).bindPopup(`<strong>${m.is_me ? 'Tú' : m.name}</strong>${m.peak_power_kwp ? `<br/>${m.peak_power_kwp} kWp` : ''}`).addTo(instance);
            });
            mapInstanceRef.current = instance;
        });
        return () => { if (mapInstanceRef.current) { (mapInstanceRef.current as { remove(): void }).remove(); mapInstanceRef.current = null; } };
    }, []);

    if (members.length === 0) {
        return (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm" style={{ color: 'var(--ink)', opacity: 0.4 }}>
                <Users className="h-8 w-8" />
                <p>{community ? 'Ningún miembro tiene dirección configurada.' : 'Aún no perteneces a ninguna comunidad.'}</p>
            </div>
        );
    }
    return <div ref={mapRef} className="h-full w-full" />;
}

function NoCommunityCard() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    function join() { router.post('/communities/join', { invite_code: code.toUpperCase() }, { onError: (e) => setError(e.invite_code ?? 'Código no válido.') }); }
    return (
        <div className="rounded-2xl border p-8" style={{ borderStyle: 'dashed', borderColor: 'var(--line)', background: 'var(--cream)' }}>
            <p className="serif mb-1 text-2xl">Aún no perteneces a ninguna comunidad</p>
            <p className="mb-6 text-sm" style={{ opacity: 0.6 }}>Crea una nueva o únete con un código de invitación.</p>
            <div className="flex flex-wrap gap-3">
                <Button asChild style={{ background: 'var(--ink)', color: 'var(--cream)', borderRadius: 9999 }}>
                    <Link href="/communities/create"><Plus className="mr-2 h-4 w-4" />Crear comunidad</Link>
                </Button>
                <Button asChild variant="outline" style={{ borderRadius: 9999 }}>
                    <Link href="/communities/guide"><BookOpen className="mr-2 h-4 w-4" />Ver guía</Link>
                </Button>
                <form onSubmit={(e) => { e.preventDefault(); join(); }} className="flex gap-2">
                    <div className="flex flex-col gap-1">
                        <Input placeholder="Código (ej. YH7ZUS87)" value={code} onChange={(e: ChangeEvent<HTMLInputElement>) => { setCode(e.target.value.toUpperCase()); setError(''); }} maxLength={8} className="font-mono uppercase" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)', borderRadius: 12 }} />
                        {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
                    </div>
                    <Button type="submit" variant="outline" disabled={code.length !== 8} style={{ borderRadius: 9999 }}>
                        <Users className="mr-2 h-4 w-4" />Unirme
                    </Button>
                </form>
            </div>
        </div>
    );
}

// KPI card
function KPI({ label, value, unit, trend, trendPositive, icon: Icon }: { label: string; value: string; unit?: string; trend?: string; trendPositive?: boolean; icon: React.ElementType }) {
    return (
        <div className="rounded-xl border p-5" style={{ background: 'var(--cream)', borderColor: 'var(--line)' }}>
            <div className="flex items-start justify-between">
                <span className="mono-label">{label}</span>
                <Icon className="h-3.5 w-3.5" style={{ opacity: 0.5 }} />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
                <span className="serif text-3xl">{value}</span>
                {unit && <span className="font-mono text-xs" style={{ opacity: 0.5 }}>{unit}</span>}
            </div>
            {trend && (
                <p className="mt-1 font-mono text-xs" style={{ color: trendPositive ? 'var(--green-deep)' : 'var(--red)', opacity: trendPositive === undefined ? 0.6 : 1 }}>{trend}</p>
            )}
        </div>
    );
}

export default function Dashboard({ dailyData, lastSettlement, currentPvpc, pvpcUpdatedAt, hourlyPvpc, community, members, hasAddress, userType, upcomingTasks }: Props) {
    usePoll(3_600_000, { only: ['currentPvpc', 'pvpcUpdatedAt', 'hourlyPvpc'] });

    const authUser = (usePage<{ auth: { user: { name: string } } }>().props as any).auth?.user;
    const firstName = authUser?.name?.split(' ')[0] ?? '';

    const isProsumer = userType === 'prosumer';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const chartData = dailyData.map((d) => ({
        day: d.day.slice(5),
        Producida: parseFloat(d.produced_kwh),
        Consumida: parseFloat(d.consumed_kwh),
        Exportada: parseFloat(d.grid_exported_kwh),
        Importada: parseFloat(d.grid_imported_kwh),
    }));

    const totalProduced30d = dailyData.reduce((s, d) => s + parseFloat(d.produced_kwh), 0);
    const totalConsumed30d = dailyData.reduce((s, d) => s + parseFloat(d.consumed_kwh), 0);
    const todayProduced = dailyData.length > 0 ? parseFloat(dailyData[dailyData.length - 1].produced_kwh) : 0;
    const co2SavedKg = Math.round(totalProduced30d * 0.233 * 10) / 10;
    const balance = lastSettlement ? parseFloat(lastSettlement.balance_eur) : null;
    const excedente = lastSettlement ? parseFloat(lastSettlement.excedente_perdido_eur) : 0;
    const p2pBoughtKwh = lastSettlement ? parseFloat(lastSettlement.total_p2p_buy_kwh) : null;
    const exportedKwh = lastSettlement ? parseFloat(lastSettlement.total_exported_kwh) : null;
    const pvpcFormatted = currentPvpc != null ? `${currentPvpc.toFixed(4)} €` : '—';
    const pvpcTime = pvpcUpdatedAt ? new Date(pvpcUpdatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null;

    return (
        <AppLayout breadcrumbs={[]}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-5 p-6">

                {/* ── No community ── */}
                {!community && <NoCommunityCard />}

                {/* ── Admin banner ── */}
                {community?.userRole === 'admin' && (
                    <div className="flex items-center justify-between rounded-xl px-5 py-3" style={{ background: 'oklch(0.92 0.08 145)', border: '1px solid oklch(0.82 0.1 145)' }}>
                        <div>
                            <p className="text-sm font-medium">Eres administrador de <strong>{community.name}</strong></p>
                            <p className="font-mono text-xs" style={{ opacity: 0.6 }}>Código: {community.invite_code}</p>
                        </div>
                        <Button asChild size="sm" variant="outline" style={{ borderRadius: 9999 }}>
                            <Link href="/my-community"><Settings className="mr-2 h-3 w-3" />Gestionar</Link>
                        </Button>
                    </div>
                )}

                {/* ── Onboarding alert ── */}
                {!hasAddress && (
                    <div className="flex items-center gap-4 rounded-xl p-4" style={{ background: 'oklch(0.95 0.06 80)', border: '1px solid oklch(0.85 0.1 80)' }}>
                        <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: 'var(--amber-deep)' }} />
                        <div className="flex-1">
                            <p className="font-medium">Completa tu perfil para empezar</p>
                            <p className="text-sm" style={{ opacity: 0.65 }}>Registra tu dirección y CUPS para participar en la comunidad.</p>
                        </div>
                        <Button asChild size="sm" variant="outline" style={{ borderRadius: 9999 }}>
                            <Link href={onboardingShow()}>Configurar →</Link>
                        </Button>
                    </div>
                )}

                {/* ── Maintenance alert ── */}
                {upcomingTasks.length > 0 && (
                    <div className="flex items-start gap-4 rounded-xl p-4" style={{ background: 'oklch(0.95 0.06 95)', border: '1px solid oklch(0.85 0.1 85)' }}>
                        <Wrench className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--amber-deep)' }} />
                        <div className="flex-1 text-sm">
                            <strong>{upcomingTasks.length === 1 ? '1 tarea de mantenimiento próxima:' : `${upcomingTasks.length} tareas de mantenimiento próximas:`}</strong>{' '}
                            {upcomingTasks.map((t) => `${new Date(t.scheduled_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${t.title}`).join(' · ')}
                        </div>
                        <Button asChild size="sm" variant="outline" style={{ borderRadius: 9999 }}>
                            <Link href={maintenanceIndex()}>Ver tareas →</Link>
                        </Button>
                    </div>
                )}

                {/* ── Hero row ── */}
                <div className="grid gap-4 lg:grid-cols-5">
                    {/* Hero dark card */}
                    <div className="rounded-2xl p-7 lg:col-span-3" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="pill pill-amber mb-3 inline-flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: 'var(--ink)' }} />
                                    En vivo
                                </span>
                                <h1 className="serif mt-3 text-4xl leading-tight" style={{ maxWidth: 380 }}>
                                    {firstName && <>Hola {firstName}.<br /></>}
                                    {isProsumer
                                        ? <>Hoy tu casa<br />ha producido <span className="ital" style={{ color: 'var(--amber)' }}>{todayProduced > 0 ? `${todayProduced.toFixed(1)} kWh` : '— kWh'}</span>.</>
                                        : <>Tu consumo es <span className="ital" style={{ color: 'var(--amber)' }}>{totalConsumed30d > 0 ? `${totalConsumed30d.toFixed(1)} kWh` : '—'}</span><br />este mes.</>
                                    }
                                </h1>
                            </div>
                            <div className="text-right">
                                <div className="mono-label mb-1" style={{ color: 'var(--cream)', opacity: 0.45 }}>Hora local</div>
                                <div className="font-mono text-3xl">{timeStr}</div>
                                <div className="mt-1 font-mono text-xs" style={{ opacity: 0.45 }}>{dateStr}</div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-4 gap-0 border-t" style={{ borderColor: 'oklch(0.32 0.02 60)' }}>
                            {[
                                { l: 'Producción 30d', v: totalProduced30d > 0 ? `${totalProduced30d.toFixed(1)} kWh` : '—' },
                                { l: 'Consumo 30d', v: totalConsumed30d > 0 ? `${totalConsumed30d.toFixed(1)} kWh` : '—' },
                                { l: 'Balance mes', v: balance != null ? `${balance > 0 ? '+' : ''}${balance.toFixed(2)} €` : '—', tone: balance != null && balance > 0 ? 'amber' : undefined },
                                { l: 'CO₂ ahorrado', v: co2SavedKg > 0 ? `–${co2SavedKg} kg` : '—', tone: co2SavedKg > 0 ? 'green' : undefined },
                            ].map((s, i) => (
                                <div key={i} className="pt-4" style={{ paddingRight: i < 3 ? 16 : 0, paddingLeft: i > 0 ? 16 : 0, borderRight: i < 3 ? '1px solid oklch(0.32 0.02 60)' : 'none' }}>
                                    <div className="font-mono text-xs" style={{ opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.l}</div>
                                    <div
                                        className="serif mt-1 text-2xl"
                                        style={{ color: s.tone === 'amber' ? 'var(--amber)' : s.tone === 'green' ? 'oklch(0.68 0.15 145)' : 'var(--cream)' }}
                                    >
                                        {s.v}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PVPC card */}
                    <div className="rounded-2xl border p-6 lg:col-span-2" style={{ background: 'var(--cream)', borderColor: 'var(--line)' }}>
                        <span className="pill pill-cream mb-3 inline-flex items-center gap-1.5">
                            <Zap className="h-2.5 w-2.5" /> PVPC HOY
                        </span>
                        <div className="serif mt-3 text-5xl" style={{ color: 'var(--amber-deep)' }}>{pvpcFormatted}</div>
                        <div className="mono-label mt-1">€/kWh · {pvpcTime ? `actualizado a las ${pvpcTime} · ESIOS` : 'sin datos'}</div>
                        <PvpcBars hours={hourlyPvpc} />
                        {excedente > 0 && (
                            <div className="mt-4 rounded-xl p-3 text-xs" style={{ background: 'oklch(0.95 0.06 95)', border: '1px solid oklch(0.85 0.1 85)' }}>
                                <AlertTriangle className="mb-1 h-3.5 w-3.5 inline" style={{ color: 'var(--amber-deep)' }} />{' '}
                                Has perdido <strong>{excedente.toFixed(2)} €</strong> por superar el tope PVPC.
                            </div>
                        )}
                        {lastSettlement && (
                            <div className="mt-4 text-xs" style={{ opacity: 0.55 }}>
                                Última liquidación: {new Date(lastSettlement.month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── 4 KPIs ── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KPI label="Balance mes" value={balance != null ? `${balance > 0 ? '+' : ''}${balance.toFixed(2)}` : '—'} unit="€" trend={balance != null && balance > 0 ? 'Ahorro respecto a tarifa' : undefined} trendPositive={balance != null && balance > 0} icon={balance != null && balance >= 0 ? TrendingUp : TrendingDown} />
                    <KPI label={isProsumer ? 'Producción 30d' : 'Consumo 30d'} value={isProsumer ? (totalProduced30d > 0 ? totalProduced30d.toFixed(1) : '—') : (totalConsumed30d > 0 ? totalConsumed30d.toFixed(1) : '—')} unit="kWh" trend={isProsumer ? 'Solar generada' : 'Total consumido'} icon={isProsumer ? Sun : Zap} />
                    <KPI label="Compra P2P" value={p2pBoughtKwh != null && p2pBoughtKwh > 0 ? p2pBoughtKwh.toFixed(1) : '—'} unit="kWh" trend={community ? `${members.length} vecinos` : 'Sin comunidad'} icon={Users} />
                    <KPI label="Exportado / compensado" value={exportedKwh != null && exportedKwh > 0 ? exportedKwh.toFixed(1) : '—'} unit="kWh" trend="Volcado a red" icon={Battery} />
                </div>

                {/* ── Chart + Map ── */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Energy chart */}
                    <div className="rounded-2xl border p-6 lg:col-span-2" style={{ background: 'var(--cream)', borderColor: 'var(--line)' }}>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="serif text-xl">Energía últimos 30 días</p>
                                <p className="mono-label mt-0.5">Producción · Consumo · Red</p>
                            </div>
                        </div>
                        {chartData.length === 0 ? (
                            <div className="flex h-48 items-center justify-center text-sm" style={{ opacity: 0.4 }}>
                                Sin datos aún — aparecerán cuando el dispositivo envíe lecturas.
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="oklch(0.7 0.17 145)" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="oklch(0.7 0.17 145)" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="oklch(0.7 0.13 235)" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="oklch(0.7 0.13 235)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                                        <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace' }} />
                                        <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace' }} unit=" kWh" />
                                        <Tooltip formatter={(v: TooltipValueType | undefined) => (typeof v === 'number' ? `${v.toFixed(2)} kWh` : v)} />
                                        {isProsumer && <Area type="monotone" dataKey="Producida" stroke="oklch(0.7 0.17 145)" fill="url(#gP)" strokeWidth={2} />}
                                        <Area type="monotone" dataKey="Consumida" stroke="oklch(0.7 0.13 235)" fill="url(#gC)" strokeWidth={2} />
                                        {isProsumer && <Area type="monotone" dataKey="Exportada" stroke="var(--amber-deep)" fill="none" strokeWidth={1} strokeDasharray="4 2" />}
                                        <Area type="monotone" dataKey="Importada" stroke="var(--amber)" fill="none" strokeWidth={1} strokeDasharray="4 2" />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <div className="mt-3 flex flex-wrap gap-4 font-mono text-xs" style={{ opacity: 0.7 }}>
                                    {isProsumer && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'oklch(0.7 0.17 145)' }} /> Producida</span>}
                                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'oklch(0.7 0.13 235)' }} /> Consumida</span>
                                    {isProsumer && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--amber-deep)' }} /> Exportada</span>}
                                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--amber)' }} /> Importada</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mini map */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border" style={{ background: 'var(--cream)', borderColor: 'var(--line)' }}>
                        <div className="p-5 pb-3">
                            <p className="serif text-xl">{community ? community.name : 'Mapa Aurora'}</p>
                            <p className="mono-label mt-0.5">Vecinos conectados</p>
                        </div>
                        <div className="flex-1" style={{ minHeight: 200 }}>
                            <CommunityMap community={community} members={members} />
                        </div>
                        <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: 'var(--line)' }}>
                            <div>
                                <div className="mono-label">Miembros</div>
                                <div className="serif text-2xl mt-0.5">{members.length} vecinos</div>
                            </div>
                            <Button asChild variant="outline" size="sm" style={{ borderRadius: 9999 }}>
                                <Link href="/map">Abrir mapa →</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

Dashboard.layout = () => null;
