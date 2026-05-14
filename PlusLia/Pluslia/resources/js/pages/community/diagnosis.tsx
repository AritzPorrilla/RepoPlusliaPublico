import { Head, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, BarChart3, Leaf, Lightbulb, Sun, TrendingDown, Users, Zap } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { dashboard } from '@/routes';
import { show as diagnosisShow } from '@/routes/community/diagnosis';
import { store as storeDiagnosis } from '@/actions/App/Http/Controllers/CommunityDiagnosisController';

interface DiagnosisEntry {
    id: number;
    user_name: string;
    roof_m2: number | null;
    monthly_kwh: number | null;
    interest_level: 'high' | 'medium' | 'low';
    has_own_panels: boolean;
    notes: string | null;
}

interface Viability {
    responded: number;
    high_interest: number;
    with_panels: number;
    total_roof_m2: number;
    total_monthly_kwh: number;
    peak_power_kwp: number;
    annual_production_kwh: number;
    annual_savings_eur: number;
    estimated_investment_eur: number;
    payback_years: number | null;
    co2_saved_kg: number;
    self_sufficiency_pct: number | null;
}

interface MyDiagnosis {
    roof_m2: number | null;
    monthly_kwh: number | null;
    interest_level: 'high' | 'medium' | 'low';
    has_own_panels: boolean;
    notes: string;
}

interface Props {
    community: { id: number; name: string };
    myDiagnosis: MyDiagnosis | null;
    diagnoses: DiagnosisEntry[];
    viability: Viability | null;
    isAdmin: boolean;
    totalMembers: number;
}

const INTEREST_LABELS = { high: 'Alto', medium: 'Medio', low: 'Bajo' };
const INTEREST_STYLES: Record<string, { bg: string; color: string }> = {
    high: { bg: 'var(--green-pluslia)', color: 'var(--green-deep)' },
    medium: { bg: 'var(--amber)', color: 'var(--ink)' },
    low: { bg: 'var(--cream-2)', color: 'var(--ink)' },
};

function DiagnosisForm({ initial }: { initial: MyDiagnosis | null }) {
    const { data, setData, post, processing, errors } = useForm({
        roof_m2: initial?.roof_m2 != null ? String(initial.roof_m2) : '',
        monthly_kwh: initial?.monthly_kwh != null ? String(initial.monthly_kwh) : '',
        interest_level: initial?.interest_level ?? 'high',
        has_own_panels: initial?.has_own_panels ?? false,
        notes: initial?.notes ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(storeDiagnosis().url, { preserveScroll: true });
    }

    return (
        <div className="rounded-xl border-2 border-dashed p-5" style={{ borderColor: 'var(--amber)' }}>
            <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--amber)' }}>
                    <Lightbulb size={13} style={{ color: 'var(--ink)' }} />
                </div>
                {initial ? 'Actualizar mi diagnóstico' : 'Rellenar mi diagnóstico'}
            </div>
            <p className="mono-label mb-4">Esta información ayuda a calcular si la comunidad energética es viable. Solo el administrador ve el resumen agregado.</p>

            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="roof_m2">Superficie disponible (m²) <span className="font-normal opacity-50">(opcional)</span></Label>
                        <Input id="roof_m2" type="number" min="0" step="0.5" placeholder="Ej: 30" value={data.roof_m2} onChange={(e) => setData('roof_m2', e.target.value)} />
                        <p className="mono-label">Tejado, cubierta o terreno apto para paneles</p>
                        <InputError message={errors.roof_m2} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="monthly_kwh">Consumo mensual (kWh) <span className="font-normal opacity-50">(opcional)</span></Label>
                        <Input id="monthly_kwh" type="number" min="0" step="1" placeholder="Ej: 250" value={data.monthly_kwh} onChange={(e) => setData('monthly_kwh', e.target.value)} />
                        <p className="mono-label">Consulta tu factura eléctrica</p>
                        <InputError message={errors.monthly_kwh} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>Nivel de interés</Label>
                        <Select value={data.interest_level} onValueChange={(v) => setData('interest_level', v as typeof data.interest_level)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high">Alto — quiero participar</SelectItem>
                                <SelectItem value="medium">Medio — me interesa pero tengo dudas</SelectItem>
                                <SelectItem value="low">Bajo — solo me informo</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.interest_level} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>¿Tienes paneles solares propios?</Label>
                        <Select value={data.has_own_panels ? 'yes' : 'no'} onValueChange={(v) => setData('has_own_panels', v === 'yes')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no">No</SelectItem>
                                <SelectItem value="yes">Sí, ya tengo instalación propia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="notes">Observaciones <span className="font-normal opacity-50">(opcional)</span></Label>
                    <Textarea id="notes" rows={2} placeholder="Limitaciones de cubierta, sombras, interés en baterías, etc." value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    <InputError message={errors.notes} />
                </div>

                <Button type="submit" disabled={processing} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90 self-start">
                    {processing ? 'Guardando...' : initial ? 'Actualizar diagnóstico' : 'Enviar diagnóstico'}
                </Button>
            </form>
        </div>
    );
}

function ViabilityPanel({ viability, totalMembers }: { viability: Viability; totalMembers: number }) {
    const participationPct = totalMembers > 0 ? Math.round(viability.responded / totalMembers * 100) : 0;

    return (
        <div className="flex flex-col gap-4">
            {/* Participation */}
            <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2 font-semibold text-sm mb-4">
                    <BarChart3 size={14} style={{ opacity: 0.5 }} />Resumen de participación
                </div>
                <div className="grid grid-cols-3 gap-4 text-center mb-3">
                    <div>
                        <p className="serif text-3xl">{viability.responded}/{totalMembers}</p>
                        <p className="mono-label">Han respondido ({participationPct}%)</p>
                    </div>
                    <div>
                        <p className="serif text-3xl" style={{ color: 'var(--green-deep)' }}>{viability.high_interest}</p>
                        <p className="mono-label">Interés alto</p>
                    </div>
                    <div>
                        <p className="serif text-3xl" style={{ color: 'var(--amber-deep)' }}>{viability.with_panels}</p>
                        <p className="mono-label">Ya tienen paneles</p>
                    </div>
                </div>
                <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--cream-2)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${participationPct}%`, background: 'var(--green-deep)' }} />
                </div>
            </div>

            {/* Solar potential */}
            <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                    <Sun size={14} style={{ color: 'var(--amber-deep)' }} />Potencial solar
                </div>
                <p className="mono-label mb-4">Estimación: {viability.total_roof_m2} m² de cubierta · 150 Wp/m² · 1 500 kWh/kWp/año</p>
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: 'var(--amber)', border: '1px solid var(--amber-deep)' }}>
                        <p className="mono-label" style={{ color: 'var(--ink)' }}>Potencia pico</p>
                        <p className="serif text-2xl" style={{ color: 'var(--ink)' }}>{viability.peak_power_kwp} kWp</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: 'var(--green-pluslia)', border: '1px solid var(--green-deep)' }}>
                        <p className="mono-label" style={{ color: 'var(--green-deep)' }}>Producción anual est.</p>
                        <p className="serif text-2xl" style={{ color: 'var(--ink)' }}>{viability.annual_production_kwh.toLocaleString('es-ES')} kWh</p>
                    </div>
                    {viability.self_sufficiency_pct !== null && (
                        <div className="rounded-xl p-3" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                            <p className="mono-label">Autoabastecimiento</p>
                            <p className="serif text-2xl">{viability.self_sufficiency_pct}%</p>
                        </div>
                    )}
                    <div className="rounded-xl p-3" style={{ background: 'var(--green-pluslia)', border: '1px solid var(--green-deep)' }}>
                        <p className="mono-label" style={{ color: 'var(--green-deep)' }}>CO₂ evitado/año</p>
                        <p className="serif text-2xl" style={{ color: 'var(--ink)' }}>{viability.co2_saved_kg.toLocaleString('es-ES')} kg</p>
                    </div>
                </div>
            </div>

            {/* Economic analysis */}
            <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                    <TrendingDown size={14} style={{ opacity: 0.5 }} />Análisis económico
                </div>
                <p className="mono-label mb-4">Estimación orientativa: 0,15 €/kWh PVPC · 1 000 €/kWp instalado</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="mono-label">Ahorro anual est.</p>
                        <p className="serif text-2xl" style={{ color: 'var(--green-deep)' }}>{viability.annual_savings_eur.toLocaleString('es-ES')} €</p>
                    </div>
                    <div>
                        <p className="mono-label">Inversión est.</p>
                        <p className="serif text-2xl">{viability.estimated_investment_eur.toLocaleString('es-ES')} €</p>
                    </div>
                    <div>
                        <p className="mono-label">Retorno est.</p>
                        <p className="serif text-2xl">{viability.payback_years != null ? `${viability.payback_years} años` : '—'}</p>
                    </div>
                </div>
                {viability.responded < 3 && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--amber)', border: '1px solid var(--amber-deep)', color: 'var(--ink)' }}>
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        Con pocos datos las estimaciones son poco precisas. Anima a más socios a rellenar su diagnóstico.
                    </div>
                )}
            </div>
        </div>
    );
}

function MembersTable({ diagnoses }: { diagnoses: DiagnosisEntry[] }) {
    if (diagnoses.length === 0) {
        return (
            <div className="rounded-xl border border-dashed p-12 flex flex-col items-center gap-3" style={{ borderColor: 'var(--line)' }}>
                <Users size={36} style={{ opacity: 0.3 }} />
                <p className="mono-label">Ningún socio ha enviado su diagnóstico aún.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
            <div className="px-5 py-3 font-semibold text-sm" style={{ background: 'var(--cream-2)', borderBottom: '1px solid var(--line)' }}>
                Respuestas individuales
            </div>
            <div className="flex flex-col">
                {diagnoses.map((d, i) => (
                    <div
                        key={d.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3"
                        style={{ borderBottom: i < diagnoses.length - 1 ? '1px solid var(--line)' : 'none' }}
                    >
                        <span className="text-sm font-medium w-32 truncate">{d.user_name}</span>
                        <span
                            className="pill"
                            style={{ background: INTEREST_STYLES[d.interest_level].bg, color: INTEREST_STYLES[d.interest_level].color }}
                        >
                            {INTEREST_LABELS[d.interest_level]}
                        </span>
                        {d.roof_m2 != null && <span className="mono-label">{d.roof_m2} m²</span>}
                        {d.monthly_kwh != null && <span className="mono-label">{d.monthly_kwh} kWh/mes</span>}
                        {d.has_own_panels && <span className="mono-label" style={{ color: 'var(--amber-deep)' }}>☀ Paneles propios</span>}
                        {d.notes && <p className="mono-label italic w-full">{d.notes}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Diagnosis({ community, myDiagnosis, diagnoses, viability, isAdmin, totalMembers }: Props) {
    const flash = (usePage<{ flash?: { success?: string } }>().props as any).flash;

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Diagnóstico', href: diagnosisShow() }]}>
            <Head title={`Diagnóstico · ${community.name}`} />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="serif text-4xl leading-tight">Diagnóstico de viabilidad</h1>
                    <p className="mono-label mt-1">{community.name} · Paso 2 del proceso de creación</p>
                </div>

                {flash?.success && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--green-pluslia)', color: 'var(--ink)', border: '1px solid var(--green-deep)' }}>
                        {flash.success}
                    </div>
                )}

                <div className={`grid gap-6 ${isAdmin ? 'lg:grid-cols-2' : ''}`}>
                    <div className="flex flex-col gap-6">
                        <DiagnosisForm initial={myDiagnosis} />

                        {!isAdmin && myDiagnosis && (
                            <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--green-pluslia)', border: '1px solid var(--green-deep)', color: 'var(--ink)' }}>
                                <Zap size={16} className="mt-0.5 shrink-0" />
                                <p className="text-sm">Tu diagnóstico ha sido registrado. El administrador verá un resumen agregado con el potencial de la comunidad.</p>
                            </div>
                        )}

                        {!isAdmin && !myDiagnosis && (
                            <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--amber)', border: '1px solid var(--amber-deep)', color: 'var(--ink)' }}>
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                <p className="text-sm">Completa el formulario para que el administrador pueda calcular la viabilidad de la comunidad.</p>
                            </div>
                        )}
                    </div>

                    {isAdmin && viability && (
                        <div className="flex flex-col gap-6">
                            <ViabilityPanel viability={viability} totalMembers={totalMembers} />
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Leaf size={14} style={{ color: 'var(--green-deep)' }} />
                            <h2 className="font-semibold text-sm">Detalle por socio</h2>
                        </div>
                        <MembersTable diagnoses={diagnoses} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

Diagnosis.layout = () => null;
