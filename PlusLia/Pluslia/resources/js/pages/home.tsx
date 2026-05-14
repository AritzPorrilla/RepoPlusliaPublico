import { Head, router, useForm, usePage, usePoll } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BookOpen,
    ChevronDown,
    Copy,
    Eye,
    EyeOff,
    Home as HomeIcon,
    Plus,
    RefreshCw,
    Settings,
    Sun,
    Terminal,
    Trash2,
    Users,
    WifiOff,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { deleteDevice as deleteDeviceAction, regenerateToken as regenerateTokenAction, registerDevice as registerDeviceAction, toggleStatus as toggleStatusAction } from '@/actions/App/Http/Controllers/HomeController';
import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Device {
    id: number;
    type: string;
    model: string;
    serial_number: string | null;
    manufacturer: string | null;
    installation_date: string | null;
    status: 'active' | 'inactive' | 'maintenance';
    last_reading_at: string | null;
    api_token: string;
    created_at: string;
}

interface Reading {
    recorded_at: string;
    produced_w: number;
    consumed_w: number;
    exported_w: number;
    imported_w: number;
    produced_wh: number;
    consumed_wh: number;
    exported_wh: number;
    imported_wh: number;
    voltage_v: number | null;
    frequency_hz: number | null;
}

interface HourlyPoint {
    time: string;
    produced_wh: number;
    consumed_wh: number;
    exported_wh: number;
    imported_wh: number;
}

interface RadiationData {
    station: string;
    location: string;
    global_w_m2: number | null;
    global_kwh_m2: number | null;
    date: string | null;
    distance_km: number;
}

interface Props {
    devices: Device[];
    lastReading: Reading | null;
    todayReadings: HourlyPoint[];
    pvpcEurKwh: number | null;
    userType: string;
    address: { cups: string; peak_power_kwp: number; street?: string } | null;
    radiation: RadiationData | null;
}

function wattLabel(w: number): string {
    return w >= 1000 ? `${(w / 1000).toFixed(1)} kW` : `${Math.round(w)} W`;
}

const DEVICE_TYPE_LABELS: Record<string, string> = {
    inverter: 'Inversor solar',
    smart_meter: 'Contador',
    plc: 'PLC',
    simulator: 'Simulador',
    ev_charger: 'Cargador EV',
    battery_storage: 'Batería',
};

const ROOM_LABEL: Record<string, string> = {
    inverter: 'Tejado',
    smart_meter: 'Cuadro eléctrico',
    plc: 'Cuadro eléctrico',
    ev_charger: 'Garaje',
    battery_storage: 'Cuadro eléctrico',
    simulator: 'General',
};

const DEVICE_GUIDES: Record<string, { title: string; intro: string; steps: string[]; payloadComment: string }> = {
    plc: {
        title: 'Configurar PLC',
        intro: 'Programa tu PLC para que envíe lecturas periódicas al endpoint HTTP de Pluslia.',
        steps: [
            'Accede al software de programación de tu PLC (TIA Portal, SoMachine, etc.).',
            'Crea un bloque de función "HTTP Client" que apunte al endpoint de abajo.',
            'Configura la cabecera Authorization con el token generado.',
            'Programa la lectura de contadores de energía (Wh) desde los módulos de entrada.',
            'Envía el JSON cada 5 minutos.',
        ],
        payloadComment: 'Usa acumuladores en el PLC y calcula el delta desde la última lectura.',
    },
    inverter: {
        title: 'Configurar inversor solar',
        intro: 'Los inversores con Modbus TCP o API REST necesitan un gateway intermedio que lea los datos y los reenvíe a Pluslia.',
        steps: [
            'Conecta el inversor a tu red local.',
            'Instala un script Python/Node.js en un Raspberry Pi.',
            'El script lee la producción del inversor vía Modbus TCP o API propia cada 5 min.',
            'El script hace POST a Pluslia con los valores leídos y el token.',
            'Configura el script como servicio systemd.',
        ],
        payloadComment: 'Si tu inversor tiene salida de pulsos, usa el contador de pulsos para calcular Wh.',
    },
    smart_meter: {
        title: 'Configurar contador inteligente',
        intro: 'Dispositivos como el Shelly 3EM o Eastron SDM120 pueden enviar datos directamente a Pluslia.',
        steps: [
            'Abre la app Shelly o la interfaz web del dispositivo.',
            'Ve a Configuración → Scripts → Añadir script.',
            'Escribe un script que haga POST a Pluslia cada 5 minutos.',
            'Introduce el token en la cabecera Authorization.',
            'Activa el script y verifica las lecturas.',
        ],
        payloadComment: 'El Shelly 3EM puede sumar los tres canales (emeter:0, emeter:1, emeter:2).',
    },
    simulator: {
        title: 'Simular lecturas',
        intro: 'Para pruebas puedes enviar lecturas ficticias con curl o cualquier cliente HTTP.',
        steps: ['Copia el comando curl.', 'Ajusta los valores.', 'Ejecuta desde tu terminal.', 'Repite cada pocos minutos.'],
        payloadComment: 'En producción reemplaza este simulador por un dispositivo real.',
    },
    ev_charger: {
        title: 'Configurar cargador VE',
        intro: 'Cargadores con API OCPP o REST (Wallbox, Easee, Zaptec) se integran mediante un adaptador.',
        steps: [
            'Activa la API local o OCPP del cargador.',
            'Instala el adaptador Pluslia en un Raspberry Pi.',
            'El adaptador lee el consumo cada 5 minutos.',
            'Hace POST a Pluslia con consumed_wh.',
            'Monitoriza desde Mi hogar.',
        ],
        payloadComment: 'El campo produced_wh debe ser 0; refleja toda la energía en consumed_wh.',
    },
    battery_storage: {
        title: 'Configurar batería',
        intro: 'Sistemas como BYD Battery-Box o Victron reportan el SoC y flujos mediante Modbus TCP.',
        steps: [
            'Conecta el BMS a la red local.',
            'Instala un adaptador que lea el SoC y flujos por Modbus TCP.',
            'El adaptador calcula produced_wh (descarga) y consumed_wh (carga).',
            'Envía los datos cada 5 minutos con el token.',
            'Configura como servicio systemd.',
        ],
        payloadComment: 'produced_wh = energía descargada; consumed_wh = energía cargada en el intervalo.',
    },
};

function ProductionGauge({ peakKwp, currentKw }: { peakKwp: number | null; currentKw: number }) {
    const hasPeak = peakKwp != null && peakKwp > 0;
    const pct = hasPeak ? Math.min(100, Math.max(0, Math.round((currentKw / peakKwp!) * 100))) : null;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    /* without peak: fill the ring proportionally to kW (capped at 10 kW reference) */
    const fillRatio = pct != null ? pct / 100 : Math.min(1, currentKw / 10);
    const strokeDashoffset = circumference * (1 - fillRatio);

    return (
        <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--line)' }}>
            <div className="mb-1 flex items-center justify-between">
                <div className="mono-label">PRODUCCIÓN AHORA</div>
                {hasPeak && <div className="mono-label" style={{ opacity: 0.45 }}>% PICO INSTALADO</div>}
            </div>
            <div className="flex items-center gap-6 pt-2">
                <div className="relative flex items-center justify-center" style={{ width: 128, height: 128, flexShrink: 0 }}>
                    <svg width={128} height={128} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                        <circle cx={64} cy={64} r={radius} fill="none" strokeWidth={10} stroke="var(--line)" />
                        <circle
                            cx={64} cy={64} r={radius} fill="none" strokeWidth={10}
                            stroke="var(--amber)"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                    </svg>
                    <div className="relative flex flex-col items-center">
                        <Sun size={16} style={{ color: 'var(--amber)' }} />
                        {pct != null ? (
                            <div className="serif mt-0.5 text-3xl leading-none">
                                {pct}<span className="text-base">%</span>
                            </div>
                        ) : (
                            <div className="serif mt-0.5 text-xl leading-none" style={{ color: 'var(--amber-deep)' }}>
                                {currentKw.toFixed(1)}<span className="text-sm"> kW</span>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    {pct != null ? (
                        <>
                            <div className="serif text-4xl leading-none" style={{ color: 'var(--amber-deep)' }}>{pct}%</div>
                            <div className="mono-label mt-2" style={{ opacity: 0.5 }}>
                                {peakKwp} kWp instalados<br />· {currentKw.toFixed(1)} kW ahora
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="serif text-3xl leading-none" style={{ color: 'var(--amber-deep)' }}>
                                {currentKw.toFixed(2)} kW
                            </div>
                            <div className="mono-label mt-2" style={{ opacity: 0.5 }}>
                                Produciendo ahora<br />
                                <span style={{ color: 'var(--amber-deep)', opacity: 0.8 }}>
                                    Configura kWp pico en el perfil
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function LiveFlowCard({ reading, address }: { reading: Reading; address: Props['address'] }) {
    const updatedAt = new Date(reading.recorded_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const isSelling = reading.exported_w > 0;

    return (
        <div style={{ background: 'var(--ink)', color: 'var(--cream)' }} className="rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
                <span className="pill pill-amber flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ink)', animation: 'pulse 2s infinite' }} />
                    FLUJO EN VIVO
                </span>
                <span className="mono-label" style={{ opacity: 0.45 }}>{updatedAt}</span>
            </div>

            {/* flow diagram */}
            <div className="grid grid-cols-5 items-center gap-0">
                {/* Solar */}
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--amber)' }}>
                        <Sun size={28} style={{ color: 'var(--ink)' }} />
                    </div>
                    <div className="serif mt-2 text-xl leading-tight">{wattLabel(reading.produced_w)}</div>
                    <div className="mono-label mt-0.5" style={{ opacity: 0.5 }}>Producción solar</div>
                </div>

                {/* arrow */}
                <div className="flex flex-col items-center gap-1">
                    <div className="mono-label" style={{ opacity: 0.5 }}>{wattLabel(reading.consumed_w)}</div>
                    <ArrowRight size={22} style={{ color: 'var(--amber)' }} />
                </div>

                {/* Home */}
                <div className="text-center">
                    <div
                        className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl"
                        style={{ background: 'oklch(0.22 0.02 60)', border: '2px solid oklch(0.32 0.02 60)' }}
                    >
                        <HomeIcon size={36} />
                    </div>
                    {address?.street ? (
                        <>
                            <div className="serif mt-2 text-base font-semibold leading-tight">{address.street}</div>
                        </>
                    ) : (
                        <div className="serif mt-2 text-base font-semibold">Mi hogar</div>
                    )}
                </div>

                {/* arrow */}
                <div className="flex flex-col items-center gap-1">
                    <div className="mono-label" style={{ opacity: 0.5 }}>{wattLabel(reading.exported_w)}</div>
                    <ArrowRight size={22} style={{ color: isSelling ? 'var(--green-pluslia)' : 'oklch(0.35 0.02 60)' }} />
                </div>

                {/* P2P / Grid */}
                <div className="text-center">
                    <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                        style={{ background: 'oklch(0.22 0.02 60)', border: `2px solid ${isSelling ? 'var(--green-pluslia)' : 'oklch(0.35 0.02 60)'}` }}
                    >
                        <Users size={26} style={{ color: isSelling ? 'var(--green-pluslia)' : 'oklch(0.45 0.02 60)' }} />
                    </div>
                    <div className="serif mt-2 text-xl leading-tight">{wattLabel(reading.exported_w)}</div>
                    <div className="mono-label mt-0.5" style={{ opacity: 0.5 }}>{isSelling ? 'P2P a vecinos' : 'Sin excedente'}</div>
                </div>
            </div>
        </div>
    );
}

function DeviceToggle({ active, loading, onClick }: { active: boolean; loading: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className="relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
            style={{
                background: active ? 'var(--green-pluslia)' : 'oklch(0.78 0.02 60)',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'wait' : 'pointer',
            }}
            title={active ? 'Desactivar dispositivo' : 'Activar dispositivo'}
        >
            <div
                className="absolute h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-all"
                style={{ left: active ? 'calc(100% - 2px - 14px)' : 2 }}
            />
        </button>
    );
}

function CompactDeviceCard({ device, reading, isFirst, isLast }: { device: Device; reading: Reading | null; isFirst: boolean; isLast: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [toggling, setToggling] = useState(false);
    const [now] = useState(Date.now);

    const guide = DEVICE_GUIDES[device.type] ?? DEVICE_GUIDES.simulator;
    const endpoint = `/api/v1/devices/${device.id}/readings`;
    const isActive = device.status === 'active';

    function handleToggle() {
        setToggling(true);
        router.patch(toggleStatusAction(device.id).url, {}, {
            preserveScroll: true,
            onFinish: () => setToggling(false),
        });
    }

    const lastSeenLabel = device.last_reading_at
        ? (() => {
            const mins = Math.round((now - new Date(device.last_reading_at).getTime()) / 60_000);
            if (mins < 2) return 'hace menos de 1 min';
            if (mins < 60) return `hace ${mins} min`;
            return `hace ${Math.round(mins / 60)} h`;
        })()
        : null;

    let valueLabel = '';
    let valueAmber = false;
    if (device.type === 'inverter' && reading && isFirst) {
        valueLabel = wattLabel(reading.produced_w);
        valueAmber = true;
    } else if (device.type === 'smart_meter' && reading && isFirst) {
        valueLabel = wattLabel(reading.consumed_w);
    } else if (device.type === 'ev_charger') {
        valueLabel = isActive ? 'Cargando' : 'Inactivo';
        valueAmber = isActive;
    } else if (lastSeenLabel) {
        valueLabel = lastSeenLabel;
    }

    const examplePayload = JSON.stringify({
        recorded_at: new Date().toISOString(),
        produced_wh: device.type === 'smart_meter' ? 0 : 1200,
        consumed_wh: 800,
        exported_wh: device.type === 'smart_meter' ? 0 : 400,
        imported_wh: 0,
        voltage_v: 230.5,
        frequency_hz: 50.0,
    }, null, 2);

    const curlCommand = `curl -X POST \\
  "${window.location.origin}${endpoint}" \\
  -H "Authorization: Bearer ${device.api_token}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ recorded_at: new Date().toISOString(), produced_wh: 1200, consumed_wh: 800, exported_wh: 400, imported_wh: 0 })}'`;

    function copyText(text: string, key: string) {
        try { navigator.clipboard.writeText(text); } catch {
            const el = document.createElement('textarea');
            el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
            document.body.appendChild(el); el.focus(); el.select();
            document.execCommand('copy'); document.body.removeChild(el);
        }
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    }

    function regenerate() {
        if (!confirm('¿Regenerar el token? El dispositivo actual dejará de enviar datos hasta que lo actualices.')) return;
        router.post(regenerateTokenAction(device.id).url, {}, { preserveScroll: true });
    }

    function deleteDevice() {
        if (!confirm(`¿Eliminar "${device.model}"? Se perderán todas sus lecturas.`)) return;
        router.delete(deleteDeviceAction(device.id).url, { preserveScroll: true });
    }

    return (
        <div>
            {/* compact row */}
            <div
                className="flex items-center gap-3 px-4 py-3"
                style={{
                    borderTop: !isFirst ? '1px solid var(--line)' : 'none',
                }}
            >
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors"
                    style={{
                        background: expanded ? 'var(--ink)' : 'var(--cream-2)',
                        border: '1px solid var(--line)',
                        color: expanded ? 'var(--cream)' : 'inherit',
                    }}
                    title="Configuración del dispositivo"
                >
                    <Settings size={14} />
                </button>

                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                        {device.model}
                        {device.manufacturer ? ` · ${device.manufacturer}` : ''}
                    </div>
                    <div className="mono-label">
                        {DEVICE_TYPE_LABELS[device.type] ?? device.type}
                        {device.serial_number ? ` · ${device.serial_number}` : ''}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {valueLabel && (
                        <span
                            className="font-mono text-sm font-semibold"
                            style={{ color: valueAmber ? 'var(--amber-deep)' : 'inherit' }}
                        >
                            {valueLabel}
                        </span>
                    )}
                    {!isActive && (
                        <AlertTriangle size={13} style={{ color: 'var(--amber-deep)', opacity: 0.7 }} />
                    )}
                    <DeviceToggle active={isActive} loading={toggling} onClick={handleToggle} />
                </div>
            </div>

            {/* expanded tech panel */}
            {expanded && (
                <div className="flex flex-col gap-4 px-4 pb-5 pt-3" style={{ borderTop: '1px solid var(--line)', background: 'var(--cream-2)' }}>
                    {/* token */}
                    <div>
                        <Label className="text-xs font-medium">Token API</Label>
                        <div className="mt-1.5 flex gap-2">
                            <Input readOnly value={showToken ? device.api_token : '•'.repeat(32)} className="font-mono text-xs" />
                            <Button size="icon" variant="ghost" onClick={() => setShowToken(!showToken)}>
                                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => copyText(device.api_token, `t-${device.id}`)}>
                                <Copy size={14} />
                            </Button>
                        </div>
                        <p className="mt-1 text-xs" style={{ opacity: 0.5 }}>
                            POST <code className="rounded px-1 py-0.5 font-mono text-[10px]" style={{ background: 'var(--cream)' }}>/api/v1/devices/{device.id}/readings</code>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={regenerate}>
                            <RefreshCw size={12} className="mr-1.5" /> Regenerar token
                        </Button>
                        <button
                            onClick={deleteDevice}
                            className="rounded-lg border p-2 text-destructive transition-colors hover:bg-red-50"
                            style={{ borderColor: 'var(--line)' }}
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>

                    {/* guide */}
                    <div className="flex flex-col gap-3 pt-2" style={{ borderTop: '1px solid var(--line)' }}>
                        <div className="flex items-center gap-2">
                            <BookOpen size={13} style={{ color: 'var(--amber-deep)' }} />
                            <span className="text-sm font-semibold">{guide.title}</span>
                        </div>
                        <p className="text-xs" style={{ opacity: 0.55 }}>{guide.intro}</p>
                        <ol className="flex flex-col gap-1.5">
                            {guide.steps.map((step, i) => (
                                <li key={i} className="flex gap-2.5 text-xs">
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>{i + 1}</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>

                        <div className="flex items-center gap-2">
                            <code className="flex-1 overflow-auto rounded-lg px-3 py-2 font-mono text-[10px]" style={{ background: 'var(--cream)' }}>
                                POST {window.location.origin}{endpoint}
                            </code>
                            <Button size="icon" variant="ghost" className="shrink-0" onClick={() => copyText(`${window.location.origin}${endpoint}`, `url-${device.id}`)}>
                                <Copy size={12} />
                            </Button>
                        </div>

                        <div>
                            <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs font-semibold">Payload JSON</span>
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => copyText(examplePayload, `json-${device.id}`)}>
                                    <Copy size={10} className="mr-1" />{copied === `json-${device.id}` ? 'Copiado' : 'Copiar'}
                                </Button>
                            </div>
                            <pre className="overflow-x-auto rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed" style={{ background: 'var(--cream)' }}>{examplePayload}</pre>
                        </div>

                        {(['simulator', 'plc', 'ev_charger', 'battery_storage'].includes(device.type)) && (
                            <div>
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-xs font-semibold"><Terminal size={11} /> Ejemplo curl</span>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => copyText(curlCommand, `curl-${device.id}`)}>
                                        <Copy size={10} className="mr-1" />{copied === `curl-${device.id}` ? 'Copiado' : 'Copiar'}
                                    </Button>
                                </div>
                                <pre className="overflow-x-auto rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--cream)' }}>{curlCommand}</pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function RegisterDeviceForm({ onCancel, showCancel }: { onCancel?: () => void; showCancel: boolean }) {
    const { data, setData, post, processing, errors } = useForm({
        type: 'inverter',
        model: '',
        manufacturer: '',
        serial_number: '',
        installation_date: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(registerDeviceAction().url, { preserveScroll: true, onSuccess: () => { onCancel?.(); } });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <Label>Tipo de dispositivo</Label>
                <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="inverter">Inversor solar</SelectItem>
                        <SelectItem value="smart_meter">Contador inteligente</SelectItem>
                        <SelectItem value="plc">PLC / Concentrador</SelectItem>
                        <SelectItem value="ev_charger">Cargador VE</SelectItem>
                        <SelectItem value="battery_storage">Batería comunitaria</SelectItem>
                        <SelectItem value="simulator">Simulador (desarrollo)</SelectItem>
                    </SelectContent>
                </Select>
                <InputError message={errors.type} />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label>Modelo / Identificador</Label>
                <Input placeholder="Ej: Fronius Primo 5.0, Shelly 3EM..." value={data.model} onChange={(e) => setData('model', e.target.value)} />
                <InputError message={errors.model} />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label>Fabricante <span className="font-normal opacity-55">(opcional)</span></Label>
                <Input placeholder="Ej: Fronius, Shelly..." value={data.manufacturer} onChange={(e) => setData('manufacturer', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <Label>Nº de serie <span className="font-normal opacity-55">(opcional)</span></Label>
                    <Input placeholder="SN123456" value={data.serial_number} onChange={(e) => setData('serial_number', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Fecha instalación <span className="font-normal opacity-55">(opcional)</span></Label>
                    <Input type="date" value={data.installation_date} onChange={(e) => setData('installation_date', e.target.value)} />
                </div>
            </div>
            <div className="flex gap-2">
                <Button type="submit" disabled={processing}>{processing ? 'Registrando...' : 'Registrar dispositivo'}</Button>
                {showCancel && onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
            </div>
        </form>
    );
}

export default function Home({ devices, lastReading, todayReadings, pvpcEurKwh, userType, address, radiation }: Props) {
    usePoll(30_000, { only: ['lastReading', 'todayReadings'] });

    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const { props } = usePage<{ flash?: { success?: string }; community?: { name: string } | null }>();
    const flash = (props as any).flash;
    const community = (props as any).community as { name: string } | null;

    // Group devices by room
    const roomGroups: [string, Device[]][] = Object.entries(
        devices.reduce<Record<string, Device[]>>((acc, d) => {
            const room = ROOM_LABEL[d.type] ?? 'General';
            if (!acc[room]) acc[room] = [];
            acc[room].push(d);
            return acc;
        }, {}),
    );

    // Consumption breakdown for right column
    const totalConsumedKwh = todayReadings.reduce((s, r) => s + r.consumed_wh, 0) / 1000;
    const CONSUMPTION_WEIGHT: Record<string, number> = { ev_charger: 4, battery_storage: 2, smart_meter: 3, plc: 1, simulator: 1 };
    const consumableDevices = devices.filter((d) => d.type !== 'inverter');
    const totalWeight = consumableDevices.reduce((s, d) => s + (CONSUMPTION_WEIGHT[d.type] ?? 1), 0) || 1;
    const consumptionRows = consumableDevices.map((d) => ({
        label: d.model || DEVICE_TYPE_LABELS[d.type] || d.type,
        kwh: (totalConsumedKwh * (CONSUMPTION_WEIGHT[d.type] ?? 1)) / totalWeight,
    })).filter((r) => r.kwh > 0.01).sort((a, b) => b.kwh - a.kwh);
    const maxKwh = consumptionRows[0]?.kwh ?? 1;

    const breadcrumbs = [
        { title: 'Smart Home', href: '/home' },
        ...(community ? [{ title: community.name }] : []),
    ];

    const headerRight = (
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                variant="outline"
                className="text-xs"
                style={{ borderRadius: 8 }}
            >
                Historial
            </Button>
            <Button
                size="sm"
                style={{ background: 'var(--amber)', color: 'var(--ink)', borderRadius: 8 }}
                className="hover:opacity-90"
                onClick={() => setShowRegisterForm(true)}
            >
                <Plus size={13} className="mr-1.5" />
                Añadir dispositivo
            </Button>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={headerRight}>
            <Head title="Smart Home" />
            <div className="flex flex-col gap-5 p-6">

                {flash?.success && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--green-pluslia)', color: 'var(--ink)' }}>
                        {flash.success}
                    </div>
                )}

                {/* Live flow */}
                {lastReading ? (
                    <LiveFlowCard reading={lastReading} address={address} />
                ) : devices.length > 0 ? (
                    <div className="flex items-center gap-4 rounded-2xl p-6" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                        <Activity size={28} style={{ opacity: 0.35 }} />
                        <div>
                            <div className="font-medium">Sin lecturas todavía</div>
                            <p className="mt-0.5 text-sm" style={{ opacity: 0.6 }}>Los dispositivos están registrados. Cuando empiecen a enviar datos aparecerán aquí.</p>
                        </div>
                    </div>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

                    {/* LEFT: devices by room */}
                    <div className="flex flex-col gap-5">

                        {/* Register form */}
                        {showRegisterForm && (
                            <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--line)' }}>
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                                        <Plus size={15} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">Nuevo dispositivo</div>
                                        <div className="mono-label">Conecta tu inversor, contador o PLC</div>
                                    </div>
                                </div>
                                <RegisterDeviceForm showCancel onCancel={() => setShowRegisterForm(false)} />
                            </div>
                        )}

                        {/* No devices */}
                        {devices.length === 0 && !showRegisterForm && (
                            <div className="rounded-2xl border border-dashed p-6" style={{ borderColor: 'var(--line)' }}>
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--cream-2)' }}>
                                        <WifiOff size={18} style={{ opacity: 0.4 }} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">Sin dispositivos registrados</div>
                                        <div className="mono-label">Conecta tu primera instalación para empezar</div>
                                    </div>
                                </div>
                                <RegisterDeviceForm showCancel={false} />
                            </div>
                        )}

                        {/* Rooms */}
                        {roomGroups.map(([room, roomDevices]) => (
                            <div key={room}>
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-semibold">{room}</span>
                                    <span className="mono-label" style={{ opacity: 0.45 }}>
                                        {roomDevices.length} {roomDevices.length === 1 ? 'dispositivo' : 'dispositivos'}
                                    </span>
                                </div>
                                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--line)' }}>
                                    {roomDevices.map((device, i) => (
                                        <CompactDeviceCard
                                            key={device.id}
                                            device={device}
                                            reading={lastReading}
                                            isFirst={i === 0}
                                            isLast={i === roomDevices.length - 1}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Radiation card (shown in left column after devices) */}
                        {radiation && (
                            <div className="flex items-start gap-3 rounded-2xl p-4" style={{ background: 'oklch(0.95 0.06 95)', border: '1px solid oklch(0.85 0.1 85)' }}>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--amber)', color: 'var(--ink)' }}>
                                    <Sun size={16} />
                                </div>
                                <div className="text-sm">
                                    <div className="font-medium">Irradiación · {radiation.location} <span className="mono-label">({radiation.distance_km} km)</span></div>
                                    <div className="mt-0.5 flex gap-4" style={{ opacity: 0.65 }}>
                                        {radiation.global_w_m2 !== null && <span>{radiation.global_w_m2} W/m²</span>}
                                        {radiation.global_kwh_m2 !== null && <span>{radiation.global_kwh_m2} kWh/m² acumulado</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: gauge + consumption + promo */}
                    <div className="flex flex-col gap-4">

                        {/* Production gauge — shown whenever there's a reading */}
                        {lastReading && (
                            <ProductionGauge
                                peakKwp={address?.peak_power_kwp && address.peak_power_kwp > 0 ? address.peak_power_kwp : null}
                                currentKw={lastReading.produced_w / 1000}
                            />
                        )}

                        {/* Consumo por estancia */}
                        {consumptionRows.length > 0 && (
                            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--line)' }}>
                                <div className="mono-label mb-1" style={{ opacity: 0.45 }}>ÚLTIMA HORA</div>
                                <div className="mb-4 text-base font-semibold">Consumo por estancia</div>
                                <div className="flex flex-col gap-3">
                                    {consumptionRows.map((row) => (
                                        <div key={row.label}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="text-sm">{row.label}</span>
                                                <span className="font-mono text-sm font-medium">
                                                    {row.kwh.toFixed(1).replace('.', ',')} kWh
                                                </span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${(row.kwh / maxKwh) * 100}%`, background: 'var(--amber)' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* PVPC */}
                        {pvpcEurKwh && (
                            <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: 'var(--line)' }}>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--cream-2)' }}>
                                    <Zap size={16} style={{ color: 'var(--amber-deep)' }} />
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="serif text-2xl" style={{ color: 'var(--amber-deep)' }}>{pvpcEurKwh.toFixed(4)}</span>
                                        <span className="mono-label">€/kWh · PVPC</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Waveshare promo */}
                        {devices.length === 0 && (
                            <div className="flex items-start gap-3 rounded-2xl p-4" style={{ background: 'oklch(0.95 0.06 80)', border: '1px solid oklch(0.85 0.1 80)' }}>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={{ background: 'var(--amber)', color: 'var(--ink)' }}>
                                    +
                                </div>
                                <div className="flex-1">
                                    <div className="mono-label mb-0.5" style={{ color: 'var(--amber-deep)' }}>AÑADIR</div>
                                    <p className="text-sm font-medium">¿Tienes un gateway Waveshare?</p>
                                    <p className="mt-1 text-xs" style={{ opacity: 0.6 }}>Configúralo paso a paso desde el asistente RS485. Tarda menos de 10 minutos.</p>
                                    <a
                                        href="/devices/waveshare"
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                                        style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                                    >
                                        Abrir asistente →
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

Home.layout = () => null;
