import { Head } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { map as mapRoute } from '@/routes';
import type { Community, CommunityMember } from '@/types';

interface Props {
    community: Community | null;
    members: CommunityMember[];
    pvpcPrice: number | null;
}

type Vista = 'comunidad' | 'barrio' | 'ciudad';

function distanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function buildPopupHtml(member: CommunityMember, community: Community | null): string {
    const isProsumer = (member.peak_power_kwp ?? 0) > 0;
    const roleLabel = isProsumer ? 'PROSUMIDOR' : 'CONSUMIDOR';
    const roleColor = isProsumer ? 'oklch(0.72 0.18 65)' : 'oklch(0.60 0.10 220)';
    const roleBg = isProsumer ? 'oklch(0.96 0.06 75)' : 'oklch(0.95 0.04 220)';
    const roleTextColor = isProsumer ? 'oklch(0.45 0.14 65)' : 'oklch(0.38 0.1 220)';
    const dist =
        community && member.lat && member.lon
            ? distanceM(community.centroid_lat!, community.centroid_lon!, member.lat, member.lon)
            : null;
    const displayName = member.is_me ? 'Tú' : member.name;
    const kwpStr = member.peak_power_kwp ? member.peak_power_kwp.toFixed(1).replace('.', ',') : null;

    return `
        <div style="min-width:210px;max-width:250px;padding:16px;font-family:system-ui,-apple-system,sans-serif">
            <div style="display:inline-flex;align-items:center;gap:5px;background:${roleBg};border:1px solid ${roleColor}55;border-radius:999px;padding:2px 10px 2px 7px;margin-bottom:10px">
                <span style="width:6px;height:6px;border-radius:50%;background:${roleColor};display:inline-block;flex-shrink:0"></span>
                <span style="font-size:10px;font-weight:600;letter-spacing:0.08em;color:${roleTextColor};font-family:monospace;text-transform:uppercase">${roleLabel}</span>
            </div>
            <div style="font-size:17px;font-weight:700;font-family:Georgia,serif;color:oklch(0.12 0.02 60);line-height:1.2;margin-bottom:3px">${displayName}</div>
            ${dist !== null ? `<div style="font-size:12px;color:oklch(0.55 0.02 60);margin-bottom:12px">a ${dist} m del centro</div>` : '<div style="margin-bottom:12px"></div>'}
            ${
                isProsumer && kwpStr
                    ? `<div style="display:flex;align-items:baseline;gap:3px;margin-bottom:14px">
                            <span style="font-size:22px;font-weight:700;color:oklch(0.65 0.18 65);font-family:Georgia,serif;line-height:1">${kwpStr}</span>
                            <span style="font-size:12px;color:oklch(0.55 0.02 60)">kWp</span>
                       </div>`
                    : '<div style="margin-bottom:14px"></div>'
            }
            <a href="/my-community" style="display:block;background:oklch(0.13 0.02 60);color:oklch(0.95 0.02 75);border-radius:8px;padding:9px 16px;font-size:13px;font-weight:500;text-align:center;text-decoration:none">Ver comunidad →</a>
        </div>
    `;
}

export default function MapPage({ community, members, pvpcPrice }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);

    const [vista, setVista] = useState<Vista>('comunidad');
    const [showProsumers, setShowProsumers] = useState(true);
    const [showConsumers, setShowConsumers] = useState(true);
    const [showBuildings, setShowBuildings] = useState(true);
    const [showP2P, setShowP2P] = useState(false);
    const [showNeighbors, setShowNeighbors] = useState(false);
    const [minKwp, setMinKwp] = useState(0);

    const totalKwp = members.reduce((s, m) => s + (m.peak_power_kwp ?? 0), 0);

    const filteredMembers = members.filter((m) => {
        if (!showProsumers && m.peak_power_kwp && m.peak_power_kwp > 0) return false;
        if (!showConsumers && (!m.peak_power_kwp || m.peak_power_kwp === 0)) return false;
        if (minKwp > 0 && (m.peak_power_kwp ?? 0) < minKwp) return false;
        return true;
    });

    /* Inject Leaflet popup overrides once */
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .pluslia-popup .leaflet-popup-content-wrapper {
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.10);
                padding: 0;
                border: 1px solid oklch(0.88 0.02 60);
                overflow: hidden;
            }
            .pluslia-popup .leaflet-popup-content { margin: 0; }
            .pluslia-popup .leaflet-popup-tip-container { display: none; }
            .pluslia-popup .leaflet-popup-close-button { display: none !important; }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;
        if (mapInstanceRef.current) {
            (mapInstanceRef.current as { remove(): void }).remove();
            mapInstanceRef.current = null;
        }

        if (filteredMembers.length === 0 && !community) return;

        import('leaflet').then((L) => {
            import('leaflet/dist/leaflet.css');

            const center: [number, number] = community
                ? [community.centroid_lat ?? 40.416, community.centroid_lon ?? -3.703]
                : [filteredMembers[0]?.lat ?? 40.416, filteredMembers[0]?.lon ?? -3.703];

            const zoom = vista === 'comunidad' ? 15 : vista === 'barrio' ? 13 : 12;
            const instance = L.map(mapRef.current!, { zoomControl: false }).setView(center, zoom);

            /* Light cream tiles */
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20,
            }).addTo(instance);

            /* Zoom control bottom-right */
            L.control.zoom({ position: 'bottomright' }).addTo(instance);

            instance.whenReady(() => {
                instance.invalidateSize();
                window.setTimeout(() => instance.invalidateSize(), 100);
            });

            filteredMembers.forEach((member) => {
                const isProsumer = (member.peak_power_kwp ?? 0) > 0;
                const color = member.is_me ? 'oklch(0.15 0.02 60)' : 'oklch(0.72 0.18 65)';
                const size = member.is_me ? 16 : 12;

                const icon = L.divIcon({
                    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,.25)"></div>`,
                    className: '',
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                });

                L.marker([member.lat, member.lon], { icon })
                    .bindPopup(buildPopupHtml(member, community), {
                        className: 'pluslia-popup',
                        maxWidth: 260,
                        offset: [0, -size / 2],
                    })
                    .addTo(instance);
            });

            if (showP2P && filteredMembers.length > 1) {
                const prosumers = filteredMembers.filter((m) => (m.peak_power_kwp ?? 0) > 0);
                const consumers = filteredMembers.filter((m) => !((m.peak_power_kwp ?? 0) > 0));
                prosumers.forEach((p) => {
                    consumers.slice(0, 3).forEach((c) => {
                        L.polyline([[p.lat, p.lon], [c.lat, c.lon]], {
                            color: 'oklch(0.72 0.18 65)',
                            weight: 1.5,
                            dashArray: '6 4',
                            opacity: 0.55,
                        }).addTo(instance);
                    });
                });
            }

            mapInstanceRef.current = instance;
        });

        return () => {
            if (mapInstanceRef.current) {
                (mapInstanceRef.current as { remove(): void }).remove();
                mapInstanceRef.current = null;
            }
        };
    }, [filteredMembers.length, showP2P, vista]);

    const pvpcHeaderRight = pvpcPrice ? (
        <div
            className="mono-label flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: 'var(--cream-2)', border: '1px solid var(--line)', fontSize: 11 }}
        >
            PVPC{' '}
            <span style={{ color: 'var(--amber-deep)', fontWeight: 700 }}>
                {pvpcPrice.toLocaleString('es-ES', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} €
            </span>
        </div>
    ) : undefined;

    const breadcrumbs = community
        ? [{ title: 'Mapa', href: mapRoute() }, { title: community.name }]
        : [{ title: 'Mapa', href: mapRoute() }];

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={pvpcHeaderRight}>
            <Head title="Mapa de la comunidad" />
            <div style={{ display: 'flex', height: 'calc(100svh - 3.5rem)', overflow: 'hidden' }}>

                {/* Filter panel */}
                <div
                    className="flex flex-col gap-5 overflow-y-auto p-5"
                    style={{ width: 268, flexShrink: 0, borderRight: '1px solid var(--line)' }}
                >
                    {/* VISTA */}
                    <div>
                        <div className="mono-label mb-2">VISTA</div>
                        <div className="flex gap-1">
                            {(['comunidad', 'barrio', 'ciudad'] as Vista[]).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setVista(v)}
                                    className="rounded-full px-3 py-1 text-sm font-medium transition-colors"
                                    style={
                                        vista === v
                                            ? { background: 'var(--ink)', color: 'var(--cream)' }
                                            : { background: 'var(--cream-2)', color: 'var(--ink)' }
                                    }
                                >
                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* MOSTRAR */}
                    <div>
                        <div className="mono-label mb-2">MOSTRAR</div>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { label: 'Prosumidores', value: showProsumers, set: setShowProsumers },
                                { label: 'Consumidores', value: showConsumers, set: setShowConsumers },
                                { label: 'Edificios completos', value: showBuildings, set: setShowBuildings },
                                { label: 'Líneas P2P activas', value: showP2P, set: setShowP2P },
                                { label: 'Comunidades vecinas', value: showNeighbors, set: setShowNeighbors },
                            ].map(({ label, value, set }) => (
                                <label key={label} className="flex cursor-pointer items-center gap-2.5 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) => set(e.target.checked)}
                                        className="h-4 w-4 rounded"
                                        style={{ accentColor: 'var(--ink)' }}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* ENERGÍA slider */}
                    <div>
                        <div className="mono-label mb-2">ENERGÍA</div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm" style={{ opacity: 0.6 }}>kWp mínimo</span>
                            <span className="font-mono text-sm font-semibold">
                                {minKwp.toFixed(1).replace('.', ',')} kWp
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={10}
                            step={0.5}
                            value={minKwp}
                            onChange={(e) => setMinKwp(parseFloat(e.target.value))}
                            className="w-full"
                            style={{ accentColor: 'var(--ink)' }}
                        />
                    </div>

                    {/* TU VECINDARIO */}
                    <div
                        className="mt-auto rounded-xl p-4"
                        style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                    >
                        <div className="mono-label mb-3" style={{ opacity: 0.45, color: 'var(--cream)' }}>
                            TU VECINDARIO
                        </div>
                        <div className="flex gap-6">
                            <div>
                                <div className="serif text-3xl leading-none" style={{ color: 'var(--amber)' }}>
                                    {totalKwp.toFixed(1).replace('.', ',')}
                                </div>
                                <div className="mono-label mt-1" style={{ color: 'var(--cream)', opacity: 0.45 }}>
                                    kWp total
                                </div>
                            </div>
                            <div>
                                <div className="serif text-3xl leading-none" style={{ color: 'var(--amber)' }}>
                                    {members.length}
                                </div>
                                <div className="mono-label mt-1" style={{ color: 'var(--cream)', opacity: 0.45 }}>
                                    vecinos
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {filteredMembers.length === 0 && !community ? (
                        <div
                            className="flex h-full w-full flex-col items-center justify-center gap-3"
                            style={{ background: 'var(--cream-2)' }}
                        >
                            <MapPin size={36} style={{ opacity: 0.3 }} />
                            <p className="mono-label">No hay miembros con dirección configurada aún.</p>
                        </div>
                    ) : (
                        <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

MapPage.layout = () => null;
