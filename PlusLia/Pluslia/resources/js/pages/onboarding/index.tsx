import { useForm } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import {
    CheckCircle,
    ChevronRight,
    Loader2,
    MapPin,
    Search,
    Sun,
    TrendingDown,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
}

interface SavingsEstimate {
    min_kwh: number;
    max_kwh: number;
    min_eur: number;
    max_eur: number;
}

interface Props {
    pvpcEurKwh: number;
}

function AddressMapPreview({ lat, lon }: { lat: number; lon: number }) {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapRef.current) {
return;
}

        let instance: { remove(): void } | null = null;

        import('leaflet').then((L) => {
            import('leaflet/dist/leaflet.css');

            if (!mapRef.current) {
return;
}

            instance = L.map(mapRef.current).setView([lat, lon], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(instance as any);

            const icon = L.divIcon({
                html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
                className: '',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });
            L.marker([lat, lon], { icon }).addTo(instance as any);
        });

        return () => {
 instance?.remove(); 
};
    }, []);

    return <div ref={mapRef} className="h-44 w-full rounded-lg" />;
}

export default function OnboardingPage({ pvpcEurKwh }: Props) {
    const [step, setStep] = useState(0);
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [savings, setSavings] = useState<SavingsEstimate | null>(null);
    const [loadingSavings, setLoadingSavings] = useState(false);

    const form = useForm({
        // Step 0
        street: '',
        lat: '',
        lon: '',
        cups: '',
        // Step 1
        user_type: '' as 'consumer' | 'prosumer' | '',
        tariff: 'pvpc' as 'pvpc' | 'libre',
        monthly_consumption_kwh: '',
        contracted_power_kw: '',
        // Step 2 (prosumer only)
        peak_power_kwp: '',
        panel_orientation: '',
        panel_inclination_deg: '',
    });

    const isProsumer = form.data.user_type === 'prosumer';

    // Steps: 0=Dirección, 1=Perfil, 2=Solar (prosumer only), 3=Ahorro
    const steps = isProsumer
        ? ['Dirección', 'Tu perfil', 'Instalación solar', 'Tu ahorro']
        : ['Dirección', 'Tu perfil', 'Tu ahorro'];

    // Map visual step index to logical step
    const visualStep = isProsumer ? step : step > 1 ? step - 1 : step;
    const totalSteps = steps.length;

    async function geocode() {
        if (!form.data.street.trim()) {
return;
}

        setGeocoding(true);
        setGeocodeError('');
        setDisplayName('');
        form.setData('lat', '');
        form.setData('lon', '');

        try {
            const params = new URLSearchParams({ q: form.data.street, format: 'json', limit: '1', countrycodes: 'es' });
            const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { Accept: 'application/json' } });

            if (!res.ok) {
throw new Error();
}

            const results: NominatimResult[] = await res.json();

            if (results.length === 0) {
 setGeocodeError('Dirección no encontrada. Incluye ciudad o código postal.');

 return; 
}

            form.setData('lat', results[0].lat);
            form.setData('lon', results[0].lon);
            setDisplayName(results[0].display_name);
        } catch {
            setGeocodeError('No se pudo conectar con el servicio de geocodificación.');
        } finally {
            setGeocoding(false);
        }
    }

    async function fetchSavings() {
        setLoadingSavings(true);
        setSavings(null);

        try {
            const params: Record<string, string> = { type: form.data.user_type as string };

            if (isProsumer && form.data.peak_power_kwp) {
                params.peak_power_kwp = form.data.peak_power_kwp;
            } else {
                params.annual_consumption_kwh = String(parseFloat(form.data.monthly_consumption_kwh) * 12);
            }

            const res = await fetch(`/api/v1/savings-estimate?${new URLSearchParams(params)}`);

            if (!res.ok) {
return;
}

            const json = await res.json();
            setSavings(json.estimate);
        } catch {
            // non-critical
        } finally {
            setLoadingSavings(false);
        }
    }

    function next() {
        const nextStep = step + 1;
        // Skip solar step (2) for consumers
        const actualNext = !isProsumer && nextStep === 2 ? 3 : nextStep;
        setStep(actualNext);

        if (actualNext === 3) {
fetchSavings();
}
    }

    function back() {
        const prevStep = step - 1;
        // Skip solar step (2) going back for consumers
        const actualPrev = !isProsumer && prevStep === 2 ? 1 : prevStep;
        setStep(actualPrev);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/onboarding');
    }

    const geocoded = !!form.data.lat && !!form.data.lon;
    const step0Valid = form.data.street.trim() !== '' && geocoded && form.data.cups.trim() !== '';
    const step1Valid = form.data.user_type !== '' && form.data.monthly_consumption_kwh !== '' && parseFloat(form.data.monthly_consumption_kwh) > 0;

    return (
        <>
            <Head title="Bienvenido a Pluslia" />
            <div
                className="flex min-h-screen items-center justify-center p-6"
                style={{ background: 'var(--cream)' }}
            >
                <div className="w-full max-w-lg">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'var(--ink)', color: 'var(--amber)' }}
                        >
                            <Zap size={28} />
                        </div>
                        <h1 className="serif text-4xl">Bienvenido a Pluslia</h1>
                        <p className="mono-label mt-2">Configura tu perfil en {totalSteps} pasos</p>
                    </div>

                    {/* Progress */}
                    <div className="mb-6 flex justify-center gap-2">
                        {steps.map((label, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium font-mono transition-colors"
                                    style={
                                        i < visualStep
                                            ? { background: 'var(--green-pluslia)', color: 'var(--ink)' }
                                            : i === visualStep
                                                ? { background: 'var(--ink)', color: 'var(--cream)' }
                                                : { background: 'var(--cream-2)', color: 'oklch(0.55 0.02 60)' }
                                    }
                                >
                                    {i < visualStep ? <CheckCircle size={14} /> : i + 1}
                                </div>
                                <span className={`hidden text-sm sm:block ${i === visualStep ? 'font-medium' : 'opacity-50'}`}>{label}</span>
                                {i < steps.length - 1 && <ChevronRight size={14} className="opacity-35" />}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={submit}>
                        {/* ── STEP 0: Dirección ── */}
                        {step === 0 && (
                            <div className="rounded-xl border p-6 flex flex-col gap-4" style={{ borderColor: 'var(--line)' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--cream-2)' }}>
                                        <MapPin size={16} style={{ color: 'var(--amber-deep)' }} />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Tu dirección</div>
                                        <div className="mono-label">Escribe tu dirección y pulsa Buscar para localizarte en el mapa.</div>
                                    </div>
                                </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="street">Dirección completa</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="street"
                                                placeholder="Calle Mayor 1, Bilbao"
                                                value={form.data.street}
                                                onChange={(e) => {
                                                    form.setData('street', e.target.value);

                                                    if (geocoded) {
 form.setData('lat', ''); form.setData('lon', ''); setDisplayName(''); 
}
                                                }}
                                                onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault(); geocode(); 
} 
}}
                                                className="flex-1"
                                            />
                                            <Button type="button" variant="outline" onClick={geocode} disabled={geocoding || !form.data.street.trim()} className="shrink-0">
                                                {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                                <span className="ml-2">Buscar</span>
                                            </Button>
                                        </div>
                                        {form.errors.street && <p className="text-destructive text-xs">{form.errors.street}</p>}
                                        {geocodeError && <p className="text-destructive text-xs">{geocodeError}</p>}
                                    </div>

                                    {geocoded && (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-start gap-2 rounded-xl p-3 text-sm" style={{ background: 'var(--green-pluslia)', border: '1px solid var(--green-deep)' }}>
                                                <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--green-deep)' }} />
                                                <p>{displayName}</p>
                                            </div>
                                            <AddressMapPreview key={`${form.data.lat},${form.data.lon}`} lat={parseFloat(form.data.lat)} lon={parseFloat(form.data.lon)} />
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="cups">CUPS</Label>
                                        <Input
                                            id="cups"
                                            placeholder="ES0021000000000000AB1"
                                            value={form.data.cups}
                                            onChange={(e) => form.setData('cups', e.target.value.toUpperCase())}
                                            maxLength={22}
                                            className="font-mono"
                                        />
                                        <p className="text-muted-foreground text-xs">Código Universal del Punto de Suministro — en tu factura de luz</p>
                                        {form.errors.cups && <p className="text-destructive text-xs">{form.errors.cups}</p>}
                                    </div>

                                    <Button type="button" onClick={next} disabled={!step0Valid} style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="hover:opacity-90">
                                        Continuar <ChevronRight size={15} className="ml-2" />
                                    </Button>
                            </div>
                        )}

                        {/* ── STEP 1: Perfil energético ── */}
                        {step === 1 && (
                            <div className="rounded-xl border p-6 flex flex-col gap-5" style={{ borderColor: 'var(--line)' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--cream-2)' }}>
                                        <Zap size={16} style={{ color: 'var(--amber-deep)' }} />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Tu perfil energético</div>
                                        <div className="mono-label">Cuéntanos cómo usas la energía para calcular tu ahorro real.</div>
                                    </div>
                                </div>

                                    {/* Role picker */}
                                    <div className="grid gap-2">
                                        <Label>¿Cuál es tu situación?</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => form.setData('user_type', 'consumer')}
                                                className="flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors"
                                                style={{
                                                    borderColor: form.data.user_type === 'consumer' ? 'var(--ink)' : 'var(--line)',
                                                    background: form.data.user_type === 'consumer' ? 'var(--cream-2)' : 'transparent',
                                                }}
                                            >
                                                <Users size={32} style={{ opacity: form.data.user_type === 'consumer' ? 1 : 0.4 }} />
                                                <div>
                                                    <p className="text-sm font-semibold">Consumidor</p>
                                                    <p className="text-xs opacity-60">Sin paneles solares. Quiero comprar energía más barata de la comunidad.</p>
                                                </div>
                                                {form.data.user_type === 'consumer' && <CheckCircle size={16} style={{ color: 'var(--green-deep)' }} />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => form.setData('user_type', 'prosumer')}
                                                className="flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors"
                                                style={{
                                                    borderColor: form.data.user_type === 'prosumer' ? 'var(--amber-deep)' : 'var(--line)',
                                                    background: form.data.user_type === 'prosumer' ? 'oklch(0.95 0.06 65)' : 'transparent',
                                                }}
                                            >
                                                <Sun size={32} style={{ color: form.data.user_type === 'prosumer' ? 'var(--amber-deep)' : undefined, opacity: form.data.user_type === 'prosumer' ? 1 : 0.4 }} />
                                                <div>
                                                    <p className="text-sm font-semibold">Prosumidor</p>
                                                    <p className="text-xs opacity-60">Tengo paneles solares. Produzco energía y quiero vender el excedente.</p>
                                                </div>
                                                {form.data.user_type === 'prosumer' && <CheckCircle size={16} style={{ color: 'var(--amber-deep)' }} />}
                                            </button>
                                        </div>
                                        {form.errors.user_type && <p className="text-destructive text-xs">{form.errors.user_type}</p>}
                                    </div>

                                    {/* Tariff */}
                                    <div className="grid gap-2">
                                        <Label>Tipo de tarifa eléctrica</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(['pvpc', 'libre'] as const).map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => form.setData('tariff', t)}
                                                    className="rounded-xl border-2 p-3 text-left transition-colors"
                                                    style={{
                                                        borderColor: form.data.tariff === t ? 'var(--green-deep)' : 'var(--line)',
                                                        background: form.data.tariff === t ? 'var(--green-pluslia)' : 'transparent',
                                                    }}
                                                >
                                                    <p className="text-sm font-semibold">{t === 'pvpc' ? 'PVPC' : 'Mercado libre'}</p>
                                                    <p className="text-xs opacity-60">
                                                        {t === 'pvpc'
                                                            ? 'Tarifa regulada (precio por hora, actualmente ' + pvpcEurKwh.toFixed(4) + ' €/kWh)'
                                                            : 'Contrato con comercializadora a precio fijo o variable'}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                        {form.errors.tariff && <p className="text-destructive text-xs">{form.errors.tariff}</p>}
                                    </div>

                                    {/* Consumption */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="consumption">Consumo mensual estimado (kWh)</Label>
                                        <Input
                                            id="consumption"
                                            type="number"
                                            step="1"
                                            min="1"
                                            placeholder="250"
                                            value={form.data.monthly_consumption_kwh}
                                            onChange={(e) => form.setData('monthly_consumption_kwh', e.target.value)}
                                        />
                                        <p className="text-muted-foreground text-xs">Lo encontrarás en tu última factura de luz.</p>
                                        {form.errors.monthly_consumption_kwh && <p className="text-destructive text-xs">{form.errors.monthly_consumption_kwh}</p>}
                                    </div>

                                    {/* Contracted power (optional) */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="contracted_power">Potencia contratada (kW) — opcional</Label>
                                        <Input
                                            id="contracted_power"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            placeholder="4.6"
                                            value={form.data.contracted_power_kw}
                                            onChange={(e) => form.setData('contracted_power_kw', e.target.value)}
                                        />
                                        <p className="text-muted-foreground text-xs">También en tu factura. Necesaria para verificar elegibilidad de compensación simplificada (≤100 kW).</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button type="button" variant="outline" onClick={back}>Atrás</Button>
                                        <Button type="button" className="flex-1 hover:opacity-90" onClick={next} disabled={!step1Valid} style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                                            {isProsumer ? 'Continuar' : 'Ver mi ahorro estimado'}
                                            <ChevronRight size={15} className="ml-2" />
                                        </Button>
                                    </div>
                            </div>
                        )}

                        {/* ── STEP 2: Instalación solar (prosumer only) ── */}
                        {step === 2 && (
                            <div className="rounded-xl border p-6 flex flex-col gap-4" style={{ borderColor: 'var(--line)' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.95 0.06 65)' }}>
                                        <Sun size={16} style={{ color: 'var(--amber-deep)' }} />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Tu instalación solar</div>
                                        <div className="mono-label">Datos de tus paneles para calcular la producción estimada.</div>
                                    </div>
                                </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="kwp">Potencia pico instalada (kWp)</Label>
                                        <Input
                                            id="kwp"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            placeholder="5.0"
                                            value={form.data.peak_power_kwp}
                                            onChange={(e) => form.setData('peak_power_kwp', e.target.value)}
                                        />
                                        <p className="text-muted-foreground text-xs">En la documentación de tu instalación o en el certificado de registro. Ejemplo: 5 kWp = 5.000 W pico.</p>
                                        {form.errors.peak_power_kwp && <p className="text-destructive text-xs">{form.errors.peak_power_kwp}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="orientation">Orientación — opcional</Label>
                                            <Input id="orientation" placeholder="Sur" value={form.data.panel_orientation} onChange={(e) => form.setData('panel_orientation', e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="inclination">Inclinación (°) — opcional</Label>
                                            <Input id="inclination" type="number" min="0" max="90" placeholder="30" value={form.data.panel_inclination_deg} onChange={(e) => form.setData('panel_inclination_deg', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Legal note */}
                                    <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                                        <strong>Compensación simplificada (RD 244/2019):</strong> Si tu instalación es ≤100 kW, tu excedente se descuenta de la factura al precio PVPC de cada hora. Sin impuesto de generación ni registro RAIPRE.
                                    </div>

                                    <div className="flex gap-3">
                                        <Button type="button" variant="outline" onClick={back}>Atrás</Button>
                                        <Button type="button" className="flex-1 hover:opacity-90" onClick={next} style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                                            Ver mi ahorro estimado <ChevronRight size={15} className="ml-2" />
                                        </Button>
                                    </div>
                            </div>
                        )}

                        {/* ── STEP 3: Ahorro estimado + Confirmación ── */}
                        {step === 3 && (
                            <div className="rounded-xl border p-6 flex flex-col gap-4" style={{ borderColor: 'var(--line)' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-pluslia)' }}>
                                        <TrendingUp size={16} style={{ color: 'var(--green-deep)' }} />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Tu ahorro estimado</div>
                                        <div className="mono-label">Basado en el PVPC actual y tu perfil energético.</div>
                                    </div>
                                </div>

                                    {/* Savings reveal */}
                                    {loadingSavings ? (
                                        <div className="flex items-center justify-center gap-2 py-8">
                                            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--green-deep)' }} />
                                            <span className="mono-label">Calculando tu ahorro...</span>
                                        </div>
                                    ) : savings ? (
                                        <div className="rounded-xl p-5" style={{ background: 'var(--green-pluslia)', border: '1px solid var(--green-deep)' }}>
                                            <div className="mono-label mb-3">
                                                {isProsumer ? 'Producción solar anual estimada' : 'Ahorro en factura anual estimado'}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center">
                                                    <div className="mono-label">Mínimo</div>
                                                    <div className="serif text-3xl mt-1" style={{ color: 'var(--green-deep)' }}>{savings.min_eur.toFixed(0)} €</div>
                                                    <div className="mono-label">{savings.min_kwh.toFixed(0)} kWh/año</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="mono-label">Máximo</div>
                                                    <div className="serif text-3xl mt-1" style={{ color: 'var(--green-deep)' }}>{savings.max_eur.toFixed(0)} €</div>
                                                    <div className="mono-label">{savings.max_kwh.toFixed(0)} kWh/año</div>
                                                </div>
                                            </div>
                                            <div className="mono-label mt-3" style={{ opacity: 0.7 }}>
                                                PVPC: {pvpcEurKwh.toFixed(4)} €/kWh · Compensación simplificada RD 244/2019
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--line)' }}>
                                            <TrendingDown size={18} style={{ opacity: 0.4 }} />
                                            <span className="opacity-60">No se pudo calcular el ahorro ahora. Podrás verlo en el dashboard.</span>
                                        </div>
                                    )}

                                    {/* Summary */}
                                    <div className="flex flex-col gap-1 rounded-xl p-4 text-sm" style={{ background: 'var(--cream-2)' }}>
                                        <div><span className="opacity-55">Dirección:</span> {form.data.street}</div>
                                        <div><span className="opacity-55">CUPS:</span> <span className="font-mono text-xs">{form.data.cups}</span></div>
                                        <div>
                                            <span className="opacity-55">Perfil:</span>{' '}
                                            {form.data.user_type === 'prosumer' ? 'Prosumidor' : 'Consumidor'} · Tarifa {form.data.tariff.toUpperCase()}
                                        </div>
                                        <div><span className="opacity-55">Consumo:</span> {form.data.monthly_consumption_kwh} kWh/mes</div>
                                        {form.data.peak_power_kwp && (
                                            <div><span className="opacity-55">Instalación solar:</span> {form.data.peak_power_kwp} kWp</div>
                                        )}
                                    </div>

                                    {form.errors.user_type && <p className="text-destructive text-xs">{form.errors.user_type}</p>}
                                    {form.errors.monthly_consumption_kwh && <p className="text-destructive text-xs">{form.errors.monthly_consumption_kwh}</p>}

                                    <div className="flex gap-3">
                                        <Button type="button" variant="outline" onClick={back}>Atrás</Button>
                                        <Button type="submit" className="flex-1 hover:opacity-90" disabled={form.processing} style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                                            {form.processing ? 'Guardando...' : '¡Empezar a ahorrar!'}
                                        </Button>
                                    </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}

OnboardingPage.layout = null;
