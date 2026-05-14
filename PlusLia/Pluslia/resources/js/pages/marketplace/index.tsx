import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Battery, ChevronDown, Plus, Zap } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as marketplaceIndex } from '@/routes/marketplace';
import type { P2pOffer } from '@/types';

interface MarketStats {
    avg_price: number | null;
    total_kwh: number;
    prosumer_count: number;
}

interface Props {
    offers: (P2pOffer & { created_at: string })[];
    myOffers: (P2pOffer & { created_at: string })[];
    myActiveOffer: (P2pOffer & { created_at: string }) | null;
    userId: number;
    marketStats: MarketStats;
}

type Tab = 'comprar' | 'vender' | 'ordenes' | 'historico';

function initials(name: string) {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
    const hues = [30, 65, 120, 180, 235, 280, 320];
    let h = 0;
    for (let i = 0; i < name.length; i++) { h = (h + name.charCodeAt(i)) % hues.length; }
    return `oklch(0.72 0.12 ${hues[h]})`;
}

function PublishForm({ onDone }: { onDone: () => void }) {
    const form = useForm({ price_eur_kwh: '', kwh_available: '', valid_until: '' });
    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/marketplace', { preserveScroll: true, onSuccess: () => { form.reset(); onDone(); } });
    }
    return (
        <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="price">Precio (€/kWh)</Label>
                    <Input id="price" type="number" step="0.001" min="0.01" max="0.99" placeholder="0.124"
                        value={form.data.price_eur_kwh} onChange={(e) => form.setData('price_eur_kwh', e.target.value)} />
                    <InputError message={form.errors.price_eur_kwh} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="kwh">Cantidad (kWh)</Label>
                    <Input id="kwh" type="number" step="0.1" min="0.1" placeholder="10.0"
                        value={form.data.kwh_available} onChange={(e) => form.setData('kwh_available', e.target.value)} />
                    <InputError message={form.errors.kwh_available} />
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="until">Válida hasta</Label>
                <Input id="until" type="datetime-local" value={form.data.valid_until}
                    onChange={(e) => form.setData('valid_until', e.target.value)} />
                <InputError message={form.errors.valid_until} />
            </div>
            <div className="flex gap-2">
                <button type="submit" disabled={form.processing}
                    className="rounded-xl px-4 py-2 text-sm font-medium"
                    style={{ background: 'var(--amber)', color: 'var(--ink)' }}>
                    {form.processing ? 'Publicando...' : 'Publicar oferta'}
                </button>
                <button type="button" onClick={onDone}
                    className="rounded-xl px-4 py-2 text-sm font-medium border"
                    style={{ borderColor: 'var(--line)' }}>
                    Cancelar
                </button>
            </div>
        </form>
    );
}

function EditPriceForm({ offer, onCancel }: { offer: P2pOffer; onCancel: () => void }) {
    const form = useForm({
        price_eur_kwh: parseFloat(offer.price_eur_kwh).toFixed(3),
        kwh_available: parseFloat(offer.kwh_available).toFixed(1),
    });
    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.patch(`/marketplace/${offer.id}`, { preserveScroll: true, onSuccess: () => onCancel() });
    }
    return (
        <form onSubmit={submit} className="flex gap-2 items-end flex-wrap">
            <div className="flex flex-col gap-1">
                <Label className="text-xs">€/kWh</Label>
                <Input type="number" step="0.001" className="w-24 h-8 text-sm"
                    value={form.data.price_eur_kwh} onChange={(e) => form.setData('price_eur_kwh', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
                <Label className="text-xs">kWh</Label>
                <Input type="number" step="0.1" className="w-20 h-8 text-sm"
                    value={form.data.kwh_available} onChange={(e) => form.setData('kwh_available', e.target.value)} />
            </div>
            <button type="submit" disabled={form.processing} className="h-8 rounded-lg px-3 text-xs font-medium"
                style={{ background: 'var(--ink)', color: 'var(--cream)' }}>Guardar</button>
            <button type="button" onClick={onCancel} className="h-8 rounded-lg px-3 text-xs border"
                style={{ borderColor: 'var(--line)' }}>✕</button>
        </form>
    );
}

export default function MarketplaceIndexPage({ offers, myOffers, myActiveOffer, userId, marketStats }: Props) {
    const flash = (usePage<{ flash?: { success?: string } }>().props as any).flash;
    const [tab, setTab] = useState<Tab>('comprar');
    const [editingOffer, setEditingOffer] = useState(false);

    const tabs: { key: Tab; label: string }[] = [
        { key: 'comprar', label: 'Comprar' },
        { key: 'vender', label: 'Vender' },
        { key: 'ordenes', label: 'Mis Órdenes' },
        { key: 'historico', label: 'Histórico' },
    ];

    const tabLabel = tabs.find((t) => t.key === tab)?.label ?? 'Comprar kWh';
    const estimatedRevenue = myActiveOffer
        ? (parseFloat(myActiveOffer.price_eur_kwh) * parseFloat(myActiveOffer.kwh_available)).toFixed(2)
        : null;

    function cancelOffer(id: number) {
        if (!confirm('¿Cancelar esta oferta?')) return;
        router.delete(`/marketplace/${id}`, { preserveScroll: true });
    }

    const publishButton = (
        <button
            onClick={() => setTab('vender')}
            className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--amber)', color: 'var(--ink)' }}
        >
            <Plus size={13} />
            Publicar oferta
        </button>
    );

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Marketplace P2P', href: marketplaceIndex() }, { title: `${tabLabel} kWh`, href: marketplaceIndex() }]}
            headerRight={publishButton}
        >
            <Head title="Marketplace P2P" />
            <div className="flex flex-col gap-0 p-6">

                {flash?.success && (
                    <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--green-pluslia)', color: 'var(--ink)', border: '1px solid var(--green-deep)' }}>
                        {flash.success}
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[1fr_296px]">

                    {/* LEFT */}
                    <div className="flex flex-col gap-0">

                        {/* Tabs + filter row */}
                        <div className="flex items-center" style={{ borderBottom: '1px solid var(--line)' }}>
                            <div className="flex">
                                {tabs.map((t) => (
                                    <button
                                        key={t.key}
                                        onClick={() => setTab(t.key)}
                                        className="px-4 py-3 text-sm font-medium transition-colors"
                                        style={{
                                            borderBottom: tab === t.key ? '2px solid var(--ink)' : '2px solid transparent',
                                            color: tab === t.key ? 'var(--ink)' : 'oklch(0.55 0.02 60)',
                                            marginBottom: -1,
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Filter pills (only on Comprar tab) */}
                            {tab === 'comprar' && (
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="mono-label">Filtrar:</span>
                                    <button className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-mono font-medium"
                                        style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                                        RADIO 500M <ChevronDown size={11} />
                                    </button>
                                    <button className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-mono font-medium"
                                        style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                                        P/kWh <ChevronDown size={11} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* COMPRAR tab */}
                        {tab === 'comprar' && (
                            <>
                                {/* Table header */}
                                <div
                                    className="grid items-center px-4 py-2"
                                    style={{
                                        gridTemplateColumns: '2.25rem 1fr 1fr 4.5rem 5rem 5.5rem',
                                        borderBottom: '1px solid var(--line)',
                                        background: 'var(--cream-2)',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <div />
                                    <div className="mono-label">VECINO</div>
                                    <div className="mono-label">COMUNIDAD · DIST.</div>
                                    <div className="mono-label text-right">kWh</div>
                                    <div className="mono-label text-right">€/kWh</div>
                                    <div />
                                </div>

                                {offers.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-16">
                                        <Zap size={36} style={{ opacity: 0.2 }} />
                                        <p className="mono-label">No hay ofertas activas en tu comunidad.</p>
                                    </div>
                                ) : (
                                    offers.map((offer) => {
                                        const isMe = offer.producer_id === userId;
                                        const name = offer.producer?.name ?? 'Vecino';
                                        const price = parseFloat(offer.price_eur_kwh);
                                        const kwh = parseFloat(offer.kwh_available);

                                        return (
                                            <div
                                                key={offer.id}
                                                className="grid items-center px-4 py-2.5"
                                                style={{
                                                    gridTemplateColumns: '2.25rem 1fr 1fr 4.5rem 5rem 5.5rem',
                                                    borderBottom: '1px solid var(--line)',
                                                    background: isMe ? 'oklch(0.96 0.06 75)' : 'transparent',
                                                    gap: '0.75rem',
                                                }}
                                            >
                                                {/* Avatar */}
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold font-mono"
                                                    style={{
                                                        background: isMe ? 'var(--amber)' : avatarColor(name),
                                                        color: 'var(--cream)',
                                                    }}
                                                >
                                                    {isMe ? 'TÚ' : initials(name)}
                                                </div>

                                                {/* Vecino */}
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium leading-tight truncate">
                                                        {isMe ? 'Tú' : name.split(' ')[0]}
                                                    </div>
                                                    <div className="mono-label truncate">
                                                        {isMe ? 'Mi oferta' : (name.split(' ').slice(1).join(' ') || '—')}
                                                    </div>
                                                </div>

                                                {/* Comunidad · distancia */}
                                                <div className="mono-label truncate">—</div>

                                                {/* kWh */}
                                                <div className="text-right font-mono text-sm font-semibold">{kwh.toFixed(1)}</div>

                                                {/* €/kWh */}
                                                <div
                                                    className="text-right font-mono text-sm font-semibold"
                                                    style={{ color: isMe ? 'var(--amber-deep)' : 'var(--ink)' }}
                                                >
                                                    {price.toFixed(3)}
                                                </div>

                                                {/* Action */}
                                                <div className="flex justify-end">
                                                    {isMe ? (
                                                        <button
                                                            onClick={() => setTab('vender')}
                                                            className="rounded-lg px-3 py-1.5 text-xs font-medium border"
                                                            style={{ borderColor: 'var(--amber)', color: 'var(--amber-deep)', background: 'transparent' }}
                                                        >
                                                            Editar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                                                            style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                                                        >
                                                            Comprar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </>
                        )}

                        {/* VENDER tab */}
                        {tab === 'vender' && (
                            <div className="rounded-xl border p-6 mt-4" style={{ borderColor: 'var(--line)' }}>
                                <p className="serif text-2xl mb-1">Publicar oferta</p>
                                <p className="mono-label mb-5">Define el precio y la cantidad que quieres vender a tus vecinos.</p>
                                <PublishForm onDone={() => setTab('comprar')} />
                            </div>
                        )}

                        {/* MIS ÓRDENES tab */}
                        {tab === 'ordenes' && (
                            <div className="flex flex-col gap-3 mt-4">
                                {myOffers.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-16">
                                        <Zap size={36} style={{ opacity: 0.2 }} />
                                        <p className="mono-label">Aún no has publicado ninguna oferta.</p>
                                    </div>
                                ) : (
                                    myOffers.map((offer) => (
                                        <div key={offer.id} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: 'var(--line)' }}>
                                            <div className="flex items-center gap-4">
                                                <span className="pill"
                                                    style={{
                                                        background: offer.status === 'active' ? 'var(--green-pluslia)' : 'var(--cream-2)',
                                                        color: offer.status === 'active' ? 'var(--green-deep)' : 'oklch(0.55 0.02 60)',
                                                        border: `1px solid ${offer.status === 'active' ? 'var(--green-deep)' : 'var(--line)'}`,
                                                    }}>
                                                    {offer.status === 'active' ? 'Activa' : offer.status === 'fulfilled' ? 'Vendida' : 'Cancelada'}
                                                </span>
                                                <span className="font-mono text-sm font-semibold">{parseFloat(offer.price_eur_kwh).toFixed(3)} €/kWh</span>
                                                <span className="mono-label">{parseFloat(offer.kwh_available).toFixed(1)} kWh</span>
                                                <span className="mono-label">{new Date(offer.created_at).toLocaleDateString('es-ES')}</span>
                                            </div>
                                            {offer.status === 'active' && (
                                                <button onClick={() => cancelOffer(offer.id)}
                                                    className="rounded-lg px-3 py-1.5 text-xs font-medium"
                                                    style={{ background: 'oklch(0.92 0.08 25)', color: 'oklch(0.45 0.18 25)' }}>
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* HISTÓRICO tab */}
                        {tab === 'historico' && (
                            <div className="flex flex-col items-center gap-3 py-16">
                                <Zap size={36} style={{ opacity: 0.2 }} />
                                <p className="mono-label">El historial de transacciones aparecerá aquí.</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT panel */}
                    <div className="flex flex-col gap-4">

                        {/* MERCADO VIVO */}
                        <div className="rounded-xl p-5" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                            <div className="mono-label mb-4" style={{ opacity: 0.5, color: 'var(--cream)' }}>MERCADO VIVO</div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="mono-label mb-1" style={{ opacity: 0.45, color: 'var(--cream)' }}>PRECIO MEDIO P2P</div>
                                    <div className="serif text-3xl" style={{ color: 'var(--amber)' }}>
                                        {marketStats.avg_price != null ? `${marketStats.avg_price.toFixed(3)} €` : '—'}
                                    </div>
                                    <div className="mono-label mt-0.5" style={{ opacity: 0.35, color: 'var(--cream)', fontSize: '0.65rem' }}>
                                        {marketStats.avg_price != null ? 'vs PVPC' : 'sin datos'}
                                    </div>
                                </div>
                                <div>
                                    <div className="mono-label mb-1" style={{ opacity: 0.45, color: 'var(--cream)' }}>DISPONIBLE</div>
                                    <div className="serif text-3xl" style={{ color: 'var(--amber)' }}>
                                        {marketStats.total_kwh > 0 ? `${marketStats.total_kwh} kWh` : '—'}
                                    </div>
                                    {marketStats.prosumer_count > 0 && (
                                        <div className="mono-label mt-0.5" style={{ opacity: 0.35, color: 'var(--cream)', fontSize: '0.65rem' }}>
                                            de {marketStats.prosumer_count} prosumidor{marketStats.prosumer_count !== 1 ? 'es' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Price sparkline */}
                            <div className="rounded-lg overflow-hidden" style={{ height: 52, background: 'oklch(0.16 0.02 60)' }}>
                                {offers.length > 1 && (() => {
                                    const prices = offers.map((o) => parseFloat(o.price_eur_kwh));
                                    const min = Math.min(...prices);
                                    const max = Math.max(...prices);
                                    const range = max - min || 0.001;
                                    const w = 280;
                                    const h = 52;
                                    const pts = prices.map((p, i) => {
                                        const x = (i / (prices.length - 1)) * w;
                                        const y = h - 8 - ((p - min) / range) * (h - 16);
                                        return `${x},${y}`;
                                    });
                                    const area = `M0,${h} L${pts[0]} ${pts.slice(1).map((p) => `L${p}`).join(' ')} L${w},${h} Z`;
                                    return (
                                        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="100%">
                                            <defs>
                                                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="oklch(0.72 0.18 65)" stopOpacity={0.25} />
                                                    <stop offset="100%" stopColor="oklch(0.72 0.18 65)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <path d={area} fill="url(#sg)" />
                                            <polyline points={pts.join(' ')} fill="none"
                                                stroke="oklch(0.72 0.18 65)" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* TU OFERTA ACTIVA */}
                        {myActiveOffer ? (
                            <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                                <div className="mono-label mb-3" style={{ color: 'var(--amber-deep)' }}>TU OFERTA ACTIVA</div>

                                {editingOffer ? (
                                    <EditPriceForm offer={myActiveOffer} onCancel={() => setEditingOffer(false)} />
                                ) : (
                                    <>
                                        <div className="serif text-2xl leading-tight">
                                            {parseFloat(myActiveOffer.kwh_available).toFixed(1)} kWh
                                            <span className="text-sm font-normal ml-2" style={{ opacity: 0.55 }}>
                                                a {parseFloat(myActiveOffer.price_eur_kwh).toFixed(3)} €/kWh
                                            </span>
                                        </div>
                                        <div className="mono-label mt-1">
                                            publicado {new Date(myActiveOffer.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
                                            <div className="mono-label mb-1">LIQUIDACIÓN ESTIMADA</div>
                                            <p className="text-sm">
                                                Si se vende todo{' '}
                                                <strong style={{ color: 'var(--green-deep)' }}>+{estimatedRevenue} €</strong>{' '}
                                                en tu próxima factura.
                                            </p>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button onClick={() => setEditingOffer(true)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium border transition-opacity hover:opacity-70"
                                                style={{ borderColor: 'var(--line)' }}>
                                                Modificar precio
                                            </button>
                                            <button onClick={() => cancelOffer(myActiveOffer.id)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                                                style={{ background: 'oklch(0.62 0.2 25)', color: 'var(--cream)' }}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div
                                className="rounded-xl border border-dashed p-5 flex flex-col items-center gap-3 text-center cursor-pointer hover:bg-[var(--cream-2)] transition-colors"
                                style={{ borderColor: 'var(--line)' }}
                                onClick={() => setTab('vender')}
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--cream-2)' }}>
                                    <Plus size={18} style={{ opacity: 0.4 }} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Sin oferta activa</p>
                                    <p className="mono-label mt-0.5">Publica energía para vender</p>
                                </div>
                            </div>
                        )}

                        {/* Batería virtual */}
                        <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--line)' }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'oklch(0.94 0.06 80)' }}>
                                <Battery size={16} style={{ color: 'var(--amber-deep)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold">Batería virtual</div>
                                <p className="mono-label">Acumula excedentes en kWh virtuales.</p>
                            </div>
                            <button className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium"
                                style={{ background: 'var(--amber)', color: 'var(--ink)' }}>
                                Activar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

MarketplaceIndexPage.layout = () => null;
