import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, CreditCard, Euro, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { storeFee, destroyFee, markPaid, markUnpaid } from '@/actions/App/Http/Controllers/CommunityFeeController';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { index as feesIndex } from '@/routes/community/fees';

interface Payment {
    id: number;
    user_id: number;
    user_name: string;
    amount_eur: number;
    status: 'pending' | 'paid';
    paid_at: string | null;
    period: string | null;
}

interface Fee {
    id: number;
    title: string;
    description: string | null;
    amount_eur: number;
    frequency: 'one_time' | 'monthly' | 'annual';
    frequency_label: string;
    active: boolean;
    payments: Payment[];
}

interface Member { id: number; name: string; email: string }

interface Props {
    community: { id: number; name: string };
    fees: Fee[];
    members: Member[];
}

function FeeCard({ fee }: { fee: Fee }) {
    const paidCount = fee.payments.filter((p) => p.status === 'paid').length;
    const total = fee.payments.length;
    const totalCollected = fee.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount_eur, 0);
    const pct = total > 0 ? (paidCount / total) * 100 : 0;

    function togglePayment(payment: Payment) {
        if (payment.status === 'paid') {
            router.post(markUnpaid(fee.id, payment.user_id).url, {}, { preserveScroll: true });
        } else {
            router.post(markPaid(fee.id, payment.user_id).url, {}, { preserveScroll: true });
        }
    }

    function deleteFee() {
        if (!confirm(`¿Eliminar la cuota "${fee.title}"? Se eliminarán también todos sus pagos.`)) { return; }
        router.delete(destroyFee(fee.id).url, { preserveScroll: true });
    }

    return (
        <div className="rounded-xl border" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-start justify-between gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
                <div>
                    <div className="flex items-center gap-2 font-semibold text-sm">
                        <Euro size={13} style={{ color: 'var(--green-deep)' }} />
                        {fee.title}
                        <span className="pill pill-cream">{fee.frequency_label}</span>
                    </div>
                    <p className="mono-label mt-0.5">
                        {fee.amount_eur.toFixed(2)} € · {paidCount}/{total} pagados · {totalCollected.toFixed(2)} € recaudados
                    </p>
                    {fee.description && <p className="mono-label mt-1">{fee.description}</p>}
                </div>
                <button
                    className="p-1.5 rounded-lg hover:bg-red-50 text-destructive transition-colors shrink-0"
                    onClick={deleteFee}
                    title="Eliminar cuota"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-3">
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--cream-2)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--green-deep)' }} />
                </div>

                <div className="flex flex-col gap-1.5">
                    {fee.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:opacity-80" style={{ background: payment.status === 'paid' ? 'var(--green-pluslia)' : 'var(--cream-2)' }}>
                            <div className="flex items-center gap-2">
                                {payment.status === 'paid'
                                    ? <CheckCircle2 size={14} style={{ color: 'var(--green-deep)' }} />
                                    : <Clock size={14} style={{ opacity: 0.4 }} />}
                                <span className="text-sm">{payment.user_name}</span>
                                {payment.paid_at && (
                                    <span className="mono-label">{new Date(payment.paid_at).toLocaleDateString('es-ES')}</span>
                                )}
                            </div>
                            <button
                                className="text-xs px-2 py-1 rounded-lg border transition-colors hover:opacity-80"
                                style={{
                                    background: payment.status === 'paid' ? 'transparent' : 'var(--ink)',
                                    color: payment.status === 'paid' ? 'var(--ink)' : 'var(--cream)',
                                    borderColor: payment.status === 'paid' ? 'var(--line)' : 'var(--ink)',
                                }}
                                onClick={() => togglePayment(payment)}
                            >
                                {payment.status === 'paid' ? 'Marcar pendiente' : 'Marcar pagado'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function NewFeeForm({ onCancel }: { onCancel: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        amount_eur: '',
        frequency: 'monthly' as 'one_time' | 'monthly' | 'annual',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(storeFee().url, { preserveScroll: true, onSuccess: () => { reset(); onCancel(); } });
    }

    return (
        <div className="rounded-xl border-2 border-dashed p-5" style={{ borderColor: 'var(--amber)' }}>
            <div className="font-semibold text-sm mb-4">Nueva cuota</div>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label>Nombre de la cuota</Label>
                    <Input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Ej: Cuota de mantenimiento mensual" />
                    <InputError message={errors.title} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Descripción <span className="font-normal opacity-50">(opcional)</span></Label>
                    <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} />
                    <InputError message={errors.description} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label>Importe (€)</Label>
                        <Input type="number" min="0.01" step="0.01" value={data.amount_eur} onChange={(e) => setData('amount_eur', e.target.value)} placeholder="25.00" />
                        <InputError message={errors.amount_eur} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Frecuencia</Label>
                        <Select value={data.frequency} onValueChange={(v) => setData('frequency', v as typeof data.frequency)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="one_time">Pago único</SelectItem>
                                <SelectItem value="monthly">Mensual</SelectItem>
                                <SelectItem value="annual">Anual</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <p className="mono-label">Se generará un pago pendiente para cada socio actual.</p>
                <div className="flex gap-2">
                    <Button type="submit" disabled={processing} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">
                        Crear cuota
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                </div>
            </form>
        </div>
    );
}

export default function Fees({ community, fees, members }: Props) {
    const [showForm, setShowForm] = useState(false);
    const flash = (usePage<{ flash?: { success?: string } }>().props as any).flash;

    const totalPending = fees.flatMap(f => f.payments).filter(p => p.status === 'pending').reduce((s, p) => s + p.amount_eur, 0);

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Mi comunidad', href: '/my-community' }, { title: 'Cuotas', href: feesIndex() }]}>
            <Head title={`Cuotas · ${community.name}`} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="serif text-4xl leading-tight">Cuotas y pagos</h1>
                        <p className="mono-label mt-1">{community.name} · {members.length} socios</p>
                    </div>
                    {!showForm && (
                        <button
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                            style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                            onClick={() => setShowForm(true)}
                        >
                            <Plus size={14} />Nueva cuota
                        </button>
                    )}
                </div>

                {flash?.success && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--green-pluslia)', color: 'var(--ink)', border: '1px solid var(--green-deep)' }}>
                        {flash.success}
                    </div>
                )}

                {totalPending > 0 && (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--amber)', border: '1px solid var(--amber-deep)', color: 'var(--ink)' }}>
                        <Clock size={16} className="shrink-0" />
                        <p className="text-sm">Hay <strong>{totalPending.toFixed(2)} €</strong> pendientes de cobro entre todos los socios.</p>
                    </div>
                )}

                {showForm && <NewFeeForm onCancel={() => setShowForm(false)} />}

                {fees.length === 0 && !showForm ? (
                    <div className="rounded-xl border border-dashed p-12 flex flex-col items-center gap-3" style={{ borderColor: 'var(--line)' }}>
                        <CreditCard size={40} style={{ opacity: 0.3 }} />
                        <p className="font-medium">Sin cuotas configuradas</p>
                        <p className="mono-label">Crea cuotas para financiar la instalación y el mantenimiento.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {fees.map((fee) => <FeeCard key={fee.id} fee={fee} />)}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

Fees.layout = () => null;
