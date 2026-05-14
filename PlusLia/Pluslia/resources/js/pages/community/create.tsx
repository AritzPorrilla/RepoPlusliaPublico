import { Head, Link, useForm } from '@inertiajs/react';
import { AlertTriangle, Building2, CheckCircle, Info, Loader2, MapPin, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { verifyCif } from '@/actions/App/Http/Controllers/CommunityController';
import { dashboard } from '@/routes';

type CifStatus = 'idle' | 'checking' | 'checksum_invalid' | 'found' | 'not_found' | 'api_error';

interface CifResult {
    checksum_valid: boolean;
    registry: {
        found: boolean;
        name: string | null;
        status: string | null;
        founded: string | null;
        province: string | null;
        municipality: string | null;
        address: string | null;
        cnae: string | null;
        cnae_label: string | null;
        api_error: boolean;
    } | null;
}

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
}

function MapPreview({ lat, lon }: { lat: number; lon: number }) {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapRef.current) { return; }

        let instance: { remove(): void } | null = null;

        import('leaflet').then((L) => {
            import('leaflet/dist/leaflet.css');

            if (!mapRef.current) { return; }

            instance = L.map(mapRef.current).setView([lat, lon], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(instance as any);
            L.circle([lat, lon], { radius: 5000, color: 'oklch(0.85 0.155 65)', fillColor: 'oklch(0.85 0.155 65)', fillOpacity: 0.15 }).addTo(instance as any);
            const icon = L.divIcon({
                html: `<div style="background:oklch(0.15 0.02 60);width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
                className: '',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });
            L.marker([lat, lon], { icon }).addTo(instance as any);
        });

        return () => { instance?.remove(); };
    }, []);

    return <div ref={mapRef} className="h-44 w-full rounded-xl" />;
}

const LEGAL_TYPES = [
    { value: 'cooperativa', label: 'Cooperativa eléctrica', hint: 'Sociedad cooperativa de consumidores de energía' },
    { value: 'asociacion', label: 'Asociación sin ánimo de lucro', hint: 'Incluye asociaciones de vecinos' },
    { value: 'sl', label: 'Sociedad Limitada (S.L.)', hint: 'Empresa mercantil de gestión de energía' },
    { value: 'slp', label: 'S.L. Pluripersonal', hint: 'SL con múltiples socios' },
    { value: 'coop_electrica', label: 'Cooperativa de servicios eléctricos', hint: 'Cooperativa específica para distribución eléctrica' },
    { value: 'vecinos', label: 'Comunidad de propietarios', hint: 'Autoconsumo colectivo en un edificio o urbanización' },
    { value: 'otro', label: 'Otra entidad legal', hint: 'Otro tipo de persona jurídica con CIF' },
] as const;

export default function CommunityCreate() {
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [cifStatus, setCifStatus] = useState<CifStatus>('idle');
    const [cifResult, setCifResult] = useState<CifResult | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        nif: '',
        legal_type: '',
        description: '',
        address_search: '',
        centroid_lat: '',
        centroid_lon: '',
        max_distance_m: '5000',
        sharing_policy: 'proportional',
    });

    const geocoded = !!data.centroid_lat && !!data.centroid_lon;
    const cifVerified = cifStatus === 'found';
    const cifBlocked = cifStatus === 'checksum_invalid' || cifStatus === 'not_found';
    const canSubmit = geocoded && cifVerified && !processing;

    async function verifyNif() {
        const nif = data.nif.trim().toUpperCase();
        if (nif.length !== 9) { return; }

        setCifStatus('checking');
        setCifResult(null);

        try {
            const url = verifyCif.url({ nif });
            const res = await fetch(url, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            const json: CifResult = await res.json();
            setCifResult(json);

            if (!json.checksum_valid) {
                setCifStatus('checksum_invalid');
            } else if (json.registry?.api_error) {
                setCifStatus('api_error');
            } else if (json.registry?.found) {
                setCifStatus('found');
            } else {
                setCifStatus('not_found');
            }
        } catch {
            setCifStatus('api_error');
        }
    }

    async function geocode() {
        if (!data.address_search.trim()) { return; }

        setGeocoding(true);
        setGeocodeError('');
        setDisplayName('');
        setData('centroid_lat', '');
        setData('centroid_lon', '');

        try {
            const params = new URLSearchParams({ q: data.address_search, format: 'json', limit: '1', countrycodes: 'es' });
            const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { Accept: 'application/json' } });

            if (!res.ok) { throw new Error(); }

            const results: NominatimResult[] = await res.json();

            if (results.length === 0) {
                setGeocodeError('Ubicación no encontrada. Prueba con ciudad o código postal.');
                return;
            }

            setData('centroid_lat', results[0].lat);
            setData('centroid_lon', results[0].lon);
            setDisplayName(results[0].display_name);
        } catch {
            setGeocodeError('No se pudo conectar con el servicio de geocodificación.');
        } finally {
            setGeocoding(false);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/communities');
    }

    const selectedLegalType = LEGAL_TYPES.find((t) => t.value === data.legal_type);

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }, { title: 'Crear comunidad', href: '/communities/create' }]}>
            <Head title="Crear comunidad" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="serif text-4xl leading-tight">Crear comunidad energética</h1>
                    <p className="mono-label mt-1">Serás el administrador. Los miembros se unen con el código de invitación automático.</p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6 max-w-xl">
                    {/* Entidad legal */}
                    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                        <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--amber)' }}>
                                <Building2 size={13} style={{ color: 'var(--ink)' }} />
                            </div>
                            Entidad legal
                        </div>
                        <p className="mono-label mb-4">En España las comunidades de energía renovable deben tener personalidad jurídica (RD 244/2019).</p>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Nombre de la comunidad</Label>
                                <Input
                                    id="name"
                                    placeholder="Comunidad Solar Ejemplo"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="nif">CIF / NIF de la entidad</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="nif"
                                            placeholder="F12345678"
                                            value={data.nif}
                                            onChange={(e) => {
                                                setData('nif', e.target.value.toUpperCase());
                                                setCifStatus('idle');
                                                setCifResult(null);
                                            }}
                                            onBlur={() => { if (data.nif.length === 9) { verifyNif(); } }}
                                            className="font-mono uppercase"
                                            maxLength={9}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="shrink-0"
                                            onClick={verifyNif}
                                            disabled={data.nif.length !== 9 || cifStatus === 'checking'}
                                        >
                                            {cifStatus === 'checking' ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                        </Button>
                                    </div>
                                    <p className="mono-label">CIF/NIF de 9 caracteres · verificación automática</p>
                                    <InputError message={errors.nif} />

                                    {cifStatus === 'checksum_invalid' && (
                                        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'oklch(0.95 0.03 20)', border: '1px solid oklch(0.85 0.1 20)', color: 'oklch(0.35 0.12 20)' }}>
                                            <AlertTriangle size={12} className="shrink-0" />
                                            CIF/NIF incorrecto — el dígito de control no es válido.
                                        </div>
                                    )}
                                    {cifStatus === 'found' && cifResult?.registry && (
                                        <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--green-pluslia)', border: '1px solid var(--green-deep)', color: 'var(--ink)' }}>
                                            <CheckCircle size={12} className="mt-0.5 shrink-0" />
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold">CIF válido — forma jurídica apta</span>
                                                {cifResult.registry.name && <span className="font-medium">{cifResult.registry.name}</span>}
                                                {cifResult.registry.status && <span>Tipo: <strong>{cifResult.registry.status}</strong></span>}
                                            </div>
                                        </div>
                                    )}
                                    {cifStatus === 'not_found' && (
                                        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'oklch(0.95 0.03 20)', border: '1px solid oklch(0.85 0.1 20)', color: 'oklch(0.35 0.12 20)' }}>
                                            <AlertTriangle size={12} className="shrink-0" />
                                            Este CIF no aparece en el Registro Mercantil. La entidad debe estar legalmente constituida.
                                        </div>
                                    )}
                                    {cifStatus === 'api_error' && (
                                        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--amber)', border: '1px solid var(--amber-deep)', color: 'var(--ink)' }}>
                                            <Info size={12} className="shrink-0" />
                                            No se pudo conectar con el BOE/BORME. Comprueba la conexión e inténtalo de nuevo.
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label>Tipo de entidad</Label>
                                    <Select value={data.legal_type} onValueChange={(v) => setData('legal_type', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LEGAL_TYPES.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.legal_type} />
                                </div>
                            </div>

                            {selectedLegalType && (
                                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
                                    <Info size={12} className="mt-0.5 shrink-0" style={{ opacity: 0.5 }} />
                                    {selectedLegalType.hint}
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="description">Descripción (opcional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe el objetivo de la comunidad, quién puede unirse, etc."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                        <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--green-pluslia)' }}>
                                <MapPin size={13} style={{ color: 'var(--green-deep)' }} />
                            </div>
                            Ubicación del centro
                        </div>
                        <p className="mono-label mb-4">El radio define la zona de autoconsumo colectivo. Todos los miembros deben estar dentro de él.</p>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label>Buscar dirección / municipio</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ej: Calle Mayor 1, Bilbao"
                                        value={data.address_search}
                                        onChange={(e) => {
                                            setData('address_search', e.target.value);
                                            if (geocoded) { setData('centroid_lat', ''); setData('centroid_lon', ''); setDisplayName(''); }
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); geocode(); } }}
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="outline" onClick={geocode} disabled={geocoding || !data.address_search.trim()} className="shrink-0">
                                        {geocoding ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                        <span className="ml-2">Buscar</span>
                                    </Button>
                                </div>
                                {geocodeError && <p className="text-destructive text-xs">{geocodeError}</p>}
                                {(errors.centroid_lat || errors.centroid_lon) && (
                                    <p className="text-destructive text-xs">Debes buscar y seleccionar una ubicación.</p>
                                )}
                            </div>

                            {geocoded && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--green-pluslia)', border: '1px solid var(--green-deep)', color: 'var(--ink)' }}>
                                        <CheckCircle size={12} className="mt-0.5 shrink-0" />
                                        <p>{displayName}</p>
                                    </div>
                                    <MapPreview
                                        key={`${data.centroid_lat},${data.centroid_lon}`}
                                        lat={parseFloat(data.centroid_lat)}
                                        lon={parseFloat(data.centroid_lon)}
                                    />
                                    <p className="mono-label text-center">El círculo muestra el radio de 5 km de la comunidad.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="radius">Radio máximo (metros)</Label>
                                    <Input
                                        id="radius"
                                        type="number"
                                        value={data.max_distance_m}
                                        onChange={(e) => setData('max_distance_m', e.target.value)}
                                    />
                                    <p className="mono-label">Máx. recomendado: 5.000 m</p>
                                    <InputError message={errors.max_distance_m} />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label>Política de reparto</Label>
                                    <Select value={data.sharing_policy} onValueChange={(v) => setData('sharing_policy', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="proportional">Proporcional (según coeficiente)</SelectItem>
                                            <SelectItem value="equal">Igual para todos</SelectItem>
                                            <SelectItem value="priority">Por prioridad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.sharing_policy} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {!cifVerified && cifStatus !== 'api_error' && (
                            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--amber)', border: '1px solid var(--amber-deep)', color: 'var(--ink)' }}>
                                <AlertTriangle size={15} className="shrink-0" />
                                {cifBlocked
                                    ? 'El CIF introducido no es válido o la entidad no está registrada. Corrígelo antes de continuar.'
                                    : 'Debes verificar el CIF en el Registro Mercantil antes de crear la comunidad.'}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                disabled={!canSubmit}
                                style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                                className="hover:opacity-90"
                            >
                                {processing ? 'Creando...' : 'Crear comunidad'}
                            </Button>
                            <Button asChild variant="outline">
                                <Link href={dashboard()}>Cancelar</Link>
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

CommunityCreate.layout = () => null;
