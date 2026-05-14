<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; }
        h1 { font-size: 18px; color: #16a34a; }
        h2 { font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f3f4f6; text-align: left; padding: 6px 8px; }
        td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; }
        .amount { text-align: right; }
        .total-row td { font-weight: bold; border-top: 2px solid #d1d5db; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 8px; border-radius: 4px; margin-top: 12px; }
        .footer { margin-top: 32px; font-size: 10px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <h1>Pluslia — Liquidación Mensual</h1>
    <p>
        <strong>Usuario:</strong> {{ $settlement->user->name }}<br>
        <strong>Periodo:</strong> {{ \Carbon\Carbon::parse($settlement->month)->translatedFormat('F Y') }}<br>
        <strong>Fecha de emisión:</strong> {{ now()->format('d/m/Y') }}
    </p>

    <h2>Resumen energético</h2>
    <table>
        <tr>
            <th>Concepto</th>
            <th class="amount">Cantidad (kWh)</th>
        </tr>
        <tr>
            <td>Energía importada de red</td>
            <td class="amount">{{ number_format($settlement->total_imported_kwh, 3) }}</td>
        </tr>
        <tr>
            <td>Energía exportada a red</td>
            <td class="amount">{{ number_format($settlement->total_exported_kwh, 3) }}</td>
        </tr>
        <tr>
            <td>Compra P2P en comunidad</td>
            <td class="amount">{{ number_format($settlement->total_p2p_buy_kwh, 3) }}</td>
        </tr>
        <tr>
            <td>Venta P2P en comunidad</td>
            <td class="amount">{{ number_format($settlement->total_p2p_sell_kwh, 3) }}</td>
        </tr>
    </table>

    <h2>Balance económico</h2>
    <table>
        <tr>
            <th>Concepto</th>
            <th class="amount">Importe (€)</th>
        </tr>
        <tr>
            <td>Balance neto del periodo</td>
            <td class="amount">{{ number_format($settlement->balance_eur, 4) }}</td>
        </tr>
        @if((float) $settlement->excedente_perdido_eur > 0)
        <tr>
            <td>Excedente perdido por tope PVPC</td>
            <td class="amount">{{ number_format($settlement->excedente_perdido_eur, 4) }}</td>
        </tr>
        @endif
        <tr class="total-row">
            <td>Saldo a {{ (float) $settlement->balance_eur >= 0 ? 'favor' : 'pagar' }}</td>
            <td class="amount">{{ number_format(abs($settlement->balance_eur), 4) }} €</td>
        </tr>
    </table>

    @if((float) $settlement->excedente_perdido_eur > 0)
    <div class="warning">
        ⚠️ Este mes has perdido <strong>{{ number_format($settlement->excedente_perdido_eur, 4) }} €</strong>
        de compensación por superar el tope PVPC. Considera contratar una batería virtual para aprovechar ese excedente.
    </div>
    @endif

    <div class="footer">
        Pluslia · Gestión de Comunidades Energéticas · Documento generado automáticamente
    </div>
</body>
</html>
