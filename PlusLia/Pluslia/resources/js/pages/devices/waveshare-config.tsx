import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle } from 'lucide-react';

// ---------- static data ----------

type SerialConfig = {
    baud: number;
    dataBits: number;
    parity: 'N' | 'E' | 'O';
    stopBits: number;
    modbusSlaveId: number;
};

type Rs485Device = {
    id: string;
    label: string;
    category: 'meter' | 'inverter' | 'plc' | 'battery';
    manufacturer: string;
    models: string;
    serial: SerialConfig;
    registerNotes: string;
    plusliaMapping: {
        produced_wh?: string;
        consumed_wh?: string;
        exported_wh?: string;
        imported_wh?: string;
        voltage_v?: string;
        frequency_hz?: string;
    };
};

const RS485_DEVICES: Rs485Device[] = [
    {
        id: 'sdm120',
        label: 'Eastron SDM120 / SDM220',
        category: 'meter',
        manufacturer: 'Eastron',
        models: 'SDM120, SDM120M, SDM220',
        serial: { baud: 2400, dataBits: 8, parity: 'N', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'Holding regs (Float, Big-Endian): 0x0000 Voltage V, 0x0006 Active Power W, 0x0048 Import kWh, 0x004A Export kWh, 0x0046 Frequency Hz',
        plusliaMapping: {
            consumed_wh: '0x0048 Import Energy (×1000 → Wh)',
            exported_wh: '0x004A Export Energy (×1000 → Wh)',
            voltage_v: '0x0000 Voltage',
            frequency_hz: '0x0046 Frequency',
        },
    },
    {
        id: 'sdm630',
        label: 'Eastron SDM630',
        category: 'meter',
        manufacturer: 'Eastron',
        models: 'SDM630, SDM630MCT',
        serial: { baud: 9600, dataBits: 8, parity: 'N', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'Holding regs (Float, Big-Endian): 0x0000 V L1, 0x0006 Active Power L1 W, 0x0156 Total Import kWh, 0x0158 Total Export kWh, 0x0046 Frequency Hz',
        plusliaMapping: {
            consumed_wh: '0x0156 Total Import kWh (×1000)',
            exported_wh: '0x0158 Total Export kWh (×1000)',
            voltage_v: '0x0000 V Phase 1',
            frequency_hz: '0x0046 Frequency',
        },
    },
    {
        id: 'em24',
        label: 'Carlo Gavazzi EM24',
        category: 'meter',
        manufacturer: 'Carlo Gavazzi',
        models: 'EM24-DIN, EM24-96, EM24-72',
        serial: { baud: 9600, dataBits: 8, parity: 'N', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'Input regs: 0x0028 V L1 (×0.1 V), 0x0052 Total Active Energy kWh (×0.1), 0x0060 Freq (×0.1 Hz). Slave ID set via dip switches.',
        plusliaMapping: {
            consumed_wh: '0x0052 E Active Total (×100 Wh)',
            voltage_v: '0x0028 V Phase 1 (×0.1)',
            frequency_hz: '0x0060 Frequency (×0.1)',
        },
    },
    {
        id: 'cvm96',
        label: 'Circutor CVM96 / CVM-C10',
        category: 'meter',
        manufacturer: 'Circutor',
        models: 'CVM96, CVM-C10, CVM-MINI',
        serial: { baud: 9600, dataBits: 8, parity: 'N', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'Holding regs (Long, Big-Endian): 0x0001 V L1 (×0.001 kV), 0x0034 Total Consumed kWh (×0.1), 0x0036 Total Generated kWh (×0.1). Default addr=1, configurable via keypad.',
        plusliaMapping: {
            consumed_wh: '0x0034 Total Consumed (×100 Wh)',
            produced_wh: '0x0036 Total Generated (×100 Wh)',
            voltage_v: '0x0001 V L1 (×1000)',
        },
    },
    {
        id: 'abb_b21',
        label: 'ABB B21 / B23 / B24',
        category: 'meter',
        manufacturer: 'ABB',
        models: 'B21 (single-phase), B23/B24 (three-phase)',
        serial: { baud: 9600, dataBits: 8, parity: 'E', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'Holding regs: 0x5B00 V L1 (Float), 0x5000 Active Power W (Float), 0x5002 Reactive Power VAR (Float), 0x6000 Active Energy Import (Float kWh).',
        plusliaMapping: {
            consumed_wh: '0x6000 Import Energy kWh (×1000)',
            exported_wh: '0x6002 Export Energy kWh (×1000)',
            voltage_v: '0x5B00 V L1',
        },
    },
    {
        id: 'growatt',
        label: 'Growatt Inverter',
        category: 'inverter',
        manufacturer: 'Growatt',
        models: 'SPH, MIN, MAX, MID, MIC series',
        serial: { baud: 9600, dataBits: 8, parity: 'N', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'Input regs: 0x0001 Status, 0x0035 AC Power W (×0.1), 0x0055 Total PV Energy kWh (Long ×0.1), 0x008A Grid Freq ×0.01 Hz, 0x008D Grid Voltage ×0.1 V.',
        plusliaMapping: {
            produced_wh: '0x0055 Total PV Energy (×100 Wh)',
            voltage_v: '0x008D Grid Voltage (×0.1)',
            frequency_hz: '0x008A Grid Freq (×0.01)',
        },
    },
    {
        id: 'solis',
        label: 'Solis Inverter',
        category: 'inverter',
        manufacturer: 'Solis / Ginlong',
        models: 'S5, S6, RHI, RAI series',
        serial: { baud: 9600, dataBits: 8, parity: 'N', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'Holding regs: 0x0C54 Total Power Generation kWh (Long), 0x0C86 AC Voltage V (×0.1), 0x0C8A Freq ×0.01 Hz, 0x0C94 Today Generation kWh (×0.1).',
        plusliaMapping: {
            produced_wh: '0x0C54 Total Generation (×1000 Wh)',
            voltage_v: '0x0C86 AC Voltage (×0.1)',
            frequency_hz: '0x0C8A Frequency (×0.01)',
        },
    },
    {
        id: 'siemens_logo',
        label: 'Siemens LOGO! 8',
        category: 'plc',
        manufacturer: 'Siemens',
        models: 'LOGO! 8.3 (0BA8)',
        serial: { baud: 19200, dataBits: 8, parity: 'E', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'Modbus via LOGO! 8 built-in RTU. Holding regs mapped in LOGO! Soft Comfort: VM0–VM850 (byte addressing). Map energy registers in VM area. Slave address set in LOGO! network settings.',
        plusliaMapping: {
            produced_wh: 'VM100 (user-defined in LOGO! program)',
            consumed_wh: 'VM104 (user-defined in LOGO! program)',
        },
    },
    {
        id: 'schneider_m221',
        label: 'Schneider Modicon M221 / M241',
        category: 'plc',
        manufacturer: 'Schneider Electric',
        models: 'TM221CE, TM221ME, TM241CE',
        serial: { baud: 19200, dataBits: 8, parity: 'E', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'Slave mode enabled via EcoStruxure Machine Expert. Memory words (%MW) map to Modbus 4x regs (offset 400001). Configure serial port in hardware catalog.',
        plusliaMapping: {
            produced_wh: '%MW100 → Modbus 40101 (user program)',
            consumed_wh: '%MW102 → Modbus 40103 (user program)',
        },
    },
    {
        id: 'omron_cp1l',
        label: 'OMRON CP1L / CP1H',
        category: 'plc',
        manufacturer: 'OMRON',
        models: 'CP1L-E, CP1L-M, CP1H-X',
        serial: { baud: 9600, dataBits: 7, parity: 'E', stopBits: 2, modbusSlaveId: 1 },
        registerNotes: 'OMRON serial uses 7E2 by default. Enable Modbus-RTU slave in CX-Programmer (Serial Communications Board). DM area words map to holding regs.',
        plusliaMapping: {
            produced_wh: 'D100 → Modbus 40101 (CX-Programmer)',
            consumed_wh: 'D102 → Modbus 40103 (CX-Programmer)',
        },
    },
    {
        id: 'delta_dvp',
        label: 'Delta DVP / AS Series',
        category: 'plc',
        manufacturer: 'Delta Electronics',
        models: 'DVP-ES2, DVP-EX2, AS200, AS300',
        serial: { baud: 9600, dataBits: 7, parity: 'E', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'Default RTU slave ID set via WPLSoft/ISPSoft. Holding regs map to D registers (D0 = 40001). Configure COM port in hardware settings (7E1 default).',
        plusliaMapping: {
            produced_wh: 'D100 → Modbus 40101',
            consumed_wh: 'D102 → Modbus 40103',
        },
    },
    {
        id: 'pylontech',
        label: 'Pylontech US2000 / US3000',
        category: 'battery',
        manufacturer: 'Pylontech',
        models: 'US2000C, US3000C, UP2500, Force H2',
        serial: { baud: 9600, dataBits: 8, parity: 'N', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'RS485 port on CAN/485 header. Holding regs: 0x1000 System SOC %, 0x1001 System Voltage ×0.001 V, 0x1002 System Current ×0.001 A, 0x1003 System Temperature ×0.1°C.',
        plusliaMapping: {
            consumed_wh: 'Calculated: I×V×t (no direct Wh reg)',
            voltage_v: '0x1001 System Voltage (×0.001)',
        },
    },
    {
        id: 'byd_battery',
        label: 'BYD Battery-Box Premium',
        category: 'battery',
        manufacturer: 'BYD',
        models: 'Battery-Box Premium HVS, HVM, LVS',
        serial: { baud: 9600, dataBits: 8, parity: 'N', stopBits: 1, modbusSlaveId: 1 },
        registerNotes: 'RS485 RTU. Holding regs (BYD protocol): 0x0100 SOC %, 0x0101 SOH %, 0x0102 Battery Voltage ×0.01 V, 0x0103 Battery Current ×0.1 A (signed).',
        plusliaMapping: {
            voltage_v: '0x0102 Battery Voltage (×0.01)',
        },
    },
];

type WaveshareModel = {
    id: string;
    label: string;
    description: string;
    defaultIp: string;
    defaultPort: number;
    modbusPort: number;
    poe: boolean;
    isolation: boolean;
    maxConnections: number;
};

const WAVESHARE_MODELS: WaveshareModel[] = [
    {
        id: 'rs485_poe_eth_b',
        label: 'RS485 TO POE ETH (B)',
        description: 'PoE IEEE 802.3af + power/signal isolation. Recomendado para instalaciones industriales.',
        defaultIp: '192.168.1.200',
        defaultPort: 4196,
        modbusPort: 502,
        poe: true,
        isolation: true,
        maxConnections: 30,
    },
    {
        id: 'rs485_eth_b',
        label: 'RS485 TO ETH (B)',
        description: 'Sin PoE, con aislamiento de señal. Alimentación por terminal 7-36 V DC.',
        defaultIp: '192.168.1.200',
        defaultPort: 4196,
        modbusPort: 502,
        poe: false,
        isolation: true,
        maxConnections: 30,
    },
    {
        id: 'rs485_eth',
        label: 'RS485 TO ETH',
        description: 'Versión básica sin aislamiento. Alimentación 5 V DC por micro-USB.',
        defaultIp: '192.168.1.200',
        defaultPort: 4196,
        modbusPort: 502,
        poe: false,
        isolation: false,
        maxConnections: 8,
    },
];

// ---------- helpers ----------

function parityLabel(p: 'N' | 'E' | 'O'): string {
    return p === 'N' ? 'None' : p === 'E' ? 'Even' : 'Odd';
}

function generatePythonScript(
    ws: WaveshareModel,
    device: Rs485Device,
    networkIp: string,
    deviceToken: string,
    deviceId: string,
): string {
    const mapping = device.plusliaMapping;
    const readLines: string[] = [];

    const regEntries = Object.entries(mapping);
    regEntries.forEach(([field, note]) => {
        readLines.push(`    # ${note}`);
        readLines.push(`    # reading['${field}'] = read_register(client, ADDRESS, COUNT)`);
    });

    return `#!/usr/bin/env python3
"""
Pluslia – ${ws.label} → ${device.label}
Generated: ${new Date().toISOString().slice(0, 10)}

Requirements:
    pip install pymodbus requests

Waveshare: ${ws.label}  IP: ${networkIp}  Port: ${ws.modbusPort} (Modbus TCP)
RS485 device: ${device.label}  Slave ID: ${device.serial.modbusSlaveId}
Serial: ${device.serial.baud} bps, ${device.serial.dataBits}${device.serial.parity}${device.serial.stopBits}
"""
import time
import requests
from datetime import datetime, timezone
from pymodbus.client import ModbusTcpClient

WAVESHARE_IP   = "${networkIp}"
MODBUS_PORT    = ${ws.modbusPort}
SLAVE_ID       = ${device.serial.modbusSlaveId}
PLUSLIA_DEVICE = "${deviceId}"
PLUSLIA_TOKEN  = "${deviceToken}"
PLUSLIA_URL    = "https://app.pluslia.com/api/v1/devices/{device}/readings".replace("{device}", PLUSLIA_DEVICE)
INTERVAL_S     = 300  # 5-minute readings


def read_float(client, address):
    """Read a 32-bit IEEE 754 float from two consecutive holding registers."""
    rr = client.read_holding_registers(address, count=2, slave=SLAVE_ID)
    if rr.isError():
        raise IOError(f"Modbus error reading {address:#06x}")
    raw = (rr.registers[0] << 16) | rr.registers[1]
    import struct
    return struct.unpack(">f", raw.to_bytes(4, "big"))[0]


def read_long(client, address):
    """Read a 32-bit unsigned int from two consecutive holding registers."""
    rr = client.read_holding_registers(address, count=2, slave=SLAVE_ID)
    if rr.isError():
        raise IOError(f"Modbus error reading {address:#06x}")
    return (rr.registers[0] << 16) | rr.registers[1]


def collect_reading(client) -> dict:
    """Return a reading dict ready for the Pluslia API."""
    reading = {}

${readLines.join('\n')}

    reading["recorded_at"] = datetime.now(timezone.utc).isoformat()
    return reading


def post_reading(reading: dict):
    resp = requests.post(
        PLUSLIA_URL,
        json=reading,
        headers={"Authorization": f"Bearer {PLUSLIA_TOKEN}"},
        timeout=10,
    )
    resp.raise_for_status()


def main():
    client = ModbusTcpClient(WAVESHARE_IP, port=MODBUS_PORT, timeout=5)
    print(f"Conectando a {WAVESHARE_IP}:{MODBUS_PORT} …")
    if not client.connect():
        raise SystemExit("No se pudo conectar al conversor Waveshare")
    print("Conexión establecida. Leyendo cada", INTERVAL_S, "segundos.")

    try:
        while True:
            try:
                reading = collect_reading(client)
                post_reading(reading)
                print(f"[{reading['recorded_at']}] Enviado OK → {reading}")
            except Exception as exc:
                print(f"Error: {exc}")
            time.sleep(INTERVAL_S)
    finally:
        client.close()


if __name__ == "__main__":
    main()
`;
}

// ---------- component ----------

type CopiedKey = string | null;

export default function WaveshareConfig() {
    const [wsModelId, setWsModelId] = useState<string>(WAVESHARE_MODELS[0].id);
    const [deviceId, setDeviceId] = useState<string>('');
    const [networkIp, setNetworkIp] = useState<string>('192.168.1.200');
    const [rs485DeviceId, setRs485DeviceId] = useState<string>(RS485_DEVICES[0].id);
    const [deviceToken, setDeviceToken] = useState<string>('');
    const [copied, setCopied] = useState<CopiedKey>(null);

    const wsModel = WAVESHARE_MODELS.find((m) => m.id === wsModelId)!;
    const rs485Device = RS485_DEVICES.find((d) => d.id === rs485DeviceId)!;
    const script = generatePythonScript(wsModel, rs485Device, networkIp, deviceToken || '<TOKEN>', deviceId || '<DEVICE_ID>');

    function copyToClipboard(text: string, key: string) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text);
        } else {
            const el = document.createElement('textarea');
            el.value = text;
            el.style.position = 'fixed';
            el.style.opacity = '0';
            document.body.appendChild(el);
            el.focus();
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    }

    const categoryLabel: Record<Rs485Device['category'], string> = {
        meter: 'Contador',
        inverter: 'Inversor',
        plc: 'PLC',
        battery: 'Batería',
    };

    const breadcrumbs = [{ title: 'Configurar Waveshare RS485', href: '/devices/waveshare' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configurar Waveshare RS485" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="serif text-4xl leading-tight">Asistente Waveshare RS485 → Pluslia</h1>
                    <p className="mono-label mt-1">Genera la configuración del conversor, los parámetros serie del dispositivo y el script Python de integración.</p>
                </div>

                <Tabs defaultValue="network" className="w-full">
                    <TabsList className="mb-4 grid w-full grid-cols-4">
                        <TabsTrigger value="network">1 · Red</TabsTrigger>
                        <TabsTrigger value="serial">2 · RS485</TabsTrigger>
                        <TabsTrigger value="script">3 · Script</TabsTrigger>
                        <TabsTrigger value="reset">Resetear</TabsTrigger>
                    </TabsList>

                    {/* ── Tab 1: Network ── */}
                    <TabsContent value="network" className="space-y-4">
                        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                            <div className="font-semibold text-sm mb-1">Modelo Waveshare</div>
                            <p className="mono-label mb-4">Selecciona el modelo exacto del conversor.</p>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label>Modelo</Label>
                                    <Select value={wsModelId} onValueChange={setWsModelId}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {WAVESHARE_MODELS.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="mono-label">{wsModel.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {wsModel.poe && <Badge variant="secondary">PoE IEEE 802.3af</Badge>}
                                    {wsModel.isolation && <Badge variant="secondary">Aislamiento galvánico</Badge>}
                                    <Badge variant="outline">Máx. {wsModel.maxConnections} conexiones TCP</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                            <div className="font-semibold text-sm mb-1">Configuración de red</div>
                            <p className="mono-label mb-4">
                                Accede a <code className="rounded px-1 text-xs" style={{ background: 'var(--cream-2)' }}>http://192.168.1.200</code> (IP por defecto) con el PC en la misma subred.
                            </p>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="ip">IP del conversor (nueva)</Label>
                                    <Input id="ip" value={networkIp} onChange={(e) => setNetworkIp(e.target.value)} placeholder="192.168.1.200" />
                                </div>

                                <div className="rounded-xl p-4" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                                    <p className="mb-3 text-sm font-medium">Parámetros a configurar en la web del conversor</p>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                        <div className="mono-label">IP Address</div><div className="font-mono">{networkIp}</div>
                                        <div className="mono-label">Subnet Mask</div><div className="font-mono">255.255.255.0</div>
                                        <div className="mono-label">Working Mode</div><div className="font-mono">Modbus TCP (puerto {wsModel.modbusPort})</div>
                                        <div className="mono-label">TCP Port</div><div className="font-mono">{wsModel.defaultPort}</div>
                                        <div className="mono-label">Timeout</div><div className="font-mono">0 (sin timeout)</div>
                                    </div>
                                </div>

                                <div className="rounded-xl p-3 text-sm" style={{ background: 'var(--amber)', border: '1px solid var(--amber-deep)', color: 'var(--ink)' }}>
                                    <p className="font-medium">Primeros pasos</p>
                                    <ol className="mt-1 list-inside list-decimal space-y-1" style={{ opacity: 0.85 }}>
                                        <li>Conecta el conversor directamente al PC por Ethernet. Pon el PC en <code className="rounded px-1 text-xs" style={{ background: 'oklch(0.88 0.12 65)' }}>192.168.1.x</code>.</li>
                                        <li>Abre <code className="rounded px-1 text-xs" style={{ background: 'oklch(0.88 0.12 65)' }}>http://192.168.1.200</code> — sin usuario/contraseña por defecto.</li>
                                        <li>En "Network Settings" cambia la IP fija y activa el modo Modbus TCP.</li>
                                        <li>Guarda y reconecta con la nueva IP.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── Tab 2: RS485 serial ── */}
                    <TabsContent value="serial" className="space-y-4">
                        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                            <div className="font-semibold text-sm mb-1">Dispositivo RS485 conectado</div>
                            <p className="mono-label mb-4">Selecciona el contador, inversor, PLC o batería que está en el bus RS485.</p>
                            <div className="flex flex-col gap-1.5">
                                <Label>Dispositivo</Label>
                                <Select value={rs485DeviceId} onValueChange={setRs485DeviceId}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(['meter', 'inverter', 'plc', 'battery'] as const).map((cat) => (
                                            <div key={cat}>
                                                <div className="mono-label px-2 py-1.5">{categoryLabel[cat]}</div>
                                                {RS485_DEVICES.filter((d) => d.category === cat).map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                                                ))}
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="mono-label">Modelos compatibles: {rs485Device.models}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                            <div className="font-semibold text-sm mb-4">Parámetros serie — configura igual en el conversor</div>
                            <div className="flex flex-col gap-4">
                                <div className="rounded-xl p-4" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                        <div className="mono-label">Baud Rate</div><div className="font-mono font-semibold">{rs485Device.serial.baud}</div>
                                        <div className="mono-label">Data Bits</div><div className="font-mono">{rs485Device.serial.dataBits}</div>
                                        <div className="mono-label">Parity</div><div className="font-mono">{parityLabel(rs485Device.serial.parity)}</div>
                                        <div className="mono-label">Stop Bits</div><div className="font-mono">{rs485Device.serial.stopBits}</div>
                                        <div className="mono-label">Flow Control</div><div className="font-mono">None</div>
                                        <div className="mono-label">Modbus Slave ID</div><div className="font-mono">{rs485Device.serial.modbusSlaveId}</div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <p className="text-sm font-medium">Registros Modbus relevantes</p>
                                    <pre className="rounded-xl p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                                        {rs485Device.registerNotes}
                                    </pre>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <p className="text-sm font-medium">Mapeo → campos Pluslia API</p>
                                    <div className="flex flex-col gap-1">
                                        {Object.entries(rs485Device.plusliaMapping).map(([field, note]) => (
                                            <div key={field} className="flex items-start gap-2 text-sm">
                                                <Badge variant="outline" className="font-mono shrink-0">{field}</Badge>
                                                <span className="mono-label">{note}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl p-3 text-sm" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                                    <p className="font-medium mb-1">Cableado RS485</p>
                                    <ul className="mono-label list-inside list-disc space-y-1">
                                        <li>Terminal <strong>A (D+)</strong> del conversor → A(+) del dispositivo</li>
                                        <li>Terminal <strong>B (D−)</strong> del conversor → B(−) del dispositivo</li>
                                        <li>Terminación 120 Ω al final del bus si hay &gt;2 nodos o cable &gt;10 m</li>
                                        <li>Conecta la pantalla del cable sólo en un extremo (tierra del conversor)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── Tab 3: Script ── */}
                    <TabsContent value="script" className="space-y-4">
                        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                            <div className="font-semibold text-sm mb-1">Datos del dispositivo Pluslia</div>
                            <p className="mono-label mb-4">Copia el ID y token desde "Mi hogar" → panel del dispositivo.</p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="device-id">Device ID</Label>
                                    <Input id="device-id" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="uuid del dispositivo" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="device-token">API Token</Label>
                                    <Input id="device-token" type="password" value={deviceToken} onChange={(e) => setDeviceToken(e.target.value)} placeholder="token de 64 caracteres" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border" style={{ borderColor: 'var(--line)' }}>
                            <div className="flex items-start justify-between gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
                                <div>
                                    <div className="font-semibold text-sm">Script Python generado</div>
                                    <p className="mono-label mt-0.5">{wsModel.label} + {rs485Device.label} → Pluslia API</p>
                                </div>
                                <Button size="sm" variant="outline" className="shrink-0" onClick={() => copyToClipboard(script, 'script')}>
                                    {copied === 'script' ? (
                                        <><CheckCircle size={13} className="mr-1.5" style={{ color: 'var(--green-deep)' }} /> Copiado</>
                                    ) : (
                                        <><Copy size={13} className="mr-1.5" /> Copiar</>
                                    )}
                                </Button>
                            </div>
                            <div className="p-5">
                                <pre className="overflow-x-auto rounded-xl p-4 text-xs leading-relaxed" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>{script}</pre>
                            </div>
                        </div>

                        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                            <div className="font-semibold text-sm mb-4">Instalar y ejecutar en Raspberry Pi / Linux</div>
                            <div className="flex flex-col gap-3">
                                {[
                                    { key: 'install', label: 'Instalar dependencias', code: 'pip install pymodbus requests' },
                                    { key: 'run', label: 'Ejecutar el script', code: 'python3 pluslia_reader.py' },
                                    {
                                        key: 'service',
                                        label: 'Ejecutar como servicio systemd',
                                        code: `[Unit]
Description=Pluslia RS485 reader
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/pluslia/pluslia_reader.py
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target`,
                                    },
                                ].map(({ key, label, code }) => (
                                    <div key={key} className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium">{label}</span>
                                            <button
                                                className="p-1 rounded-lg hover:opacity-70 transition-opacity"
                                                onClick={() => copyToClipboard(code, key)}
                                            >
                                                {copied === key ? (
                                                    <CheckCircle size={13} style={{ color: 'var(--green-deep)' }} />
                                                ) : (
                                                    <Copy size={13} style={{ opacity: 0.5 }} />
                                                )}
                                            </button>
                                        </div>
                                        <pre className="rounded-xl p-2 text-xs" style={{ background: 'var(--cream-2)' }}>{code}</pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── Tab 4: Factory reset ── */}
                    <TabsContent value="reset" className="space-y-4">
                        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--line)' }}>
                            <div className="font-semibold text-sm mb-1">Reset de fábrica</div>
                            <p className="mono-label mb-4">Restaura la IP por defecto 192.168.1.200 si has perdido el acceso.</p>
                            <div className="flex flex-col gap-4">
                                <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                                    <p className="text-sm font-medium">Procedimiento físico (todos los modelos)</p>
                                    <ol className="text-sm space-y-1.5 list-inside list-decimal">
                                        <li>Con el conversor encendido, localiza el pin <strong>NC</strong> (o botón RESET si lo tiene).</li>
                                        <li>Cortocircuita el pin <strong>NC</strong> a <strong>GND</strong> durante <strong>5 segundos</strong> con un clip o cable.</li>
                                        <li>El LED parpadeará rápido — suelta el cortocircuito.</li>
                                        <li>El conversor reinicia con IP <code className="rounded px-1 text-xs" style={{ background: 'var(--line)' }}>192.168.1.200</code>.</li>
                                    </ol>
                                </div>

                                <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                                    <p className="text-sm font-medium">Reset por software (desde la web)</p>
                                    <ol className="text-sm space-y-1.5 list-inside list-decimal">
                                        <li>Accede a la web del conversor.</li>
                                        <li>Ve a <strong>System → Restore Factory Settings</strong>.</li>
                                        <li>Confirma. El conversor reinicia.</li>
                                    </ol>
                                </div>

                                <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                                    <p className="text-sm font-medium">Configuración con VirCom (Windows)</p>
                                    <p className="mono-label">VirCom crea puertos COM virtuales que mapean al conversor por UDP/TCP, útil para software legacy que requiere un puerto COM real.</p>
                                    <ol className="text-sm space-y-1.5 list-inside list-decimal">
                                        <li>Descarga VirCom desde la wiki de Waveshare.</li>
                                        <li>Añade un nuevo puerto virtual → protocolo UDP o TCP → IP del conversor → puerto {wsModel.defaultPort}.</li>
                                        <li>El SO verá el conversor como COMx.</li>
                                    </ol>
                                </div>

                                <div className="rounded-xl p-3 text-sm" style={{ background: 'oklch(0.96 0.02 20)', border: '1px solid oklch(0.85 0.08 20)', color: 'oklch(0.35 0.12 20)' }}>
                                    <p className="font-medium">Importante</p>
                                    <p className="mt-1">El reset borra <strong>toda la configuración</strong>: IP, modo, parámetros serie. Tendrás que reconfigurar desde cero usando la pestaña "Red".</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

WaveshareConfig.layout = () => null;
