<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\PriceTick;
use App\Services\AemetClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request, AemetClient $aemet): Response
    {
        $user = $request->user();
        $devices = $user->devices()->latest()->get();
        $device = $devices->first();

        $lastReading = $device
            ? $device->energyReadings()->latest("recorded_at")->first()
            : null;

        // Hourly readings for today (Madrid time)
        $todayReadings = [];
        if ($device) {
            $todayStart = Carbon::now("Europe/Madrid")->startOfDay()->utc();
            $todayEnd = Carbon::now("Europe/Madrid")->endOfDay()->utc();

            $todayReadings = $device->energyReadings()
                ->whereBetween("recorded_at", [$todayStart, $todayEnd])
                ->orderBy("recorded_at")
                ->get(["recorded_at", "produced_wh", "consumed_wh", "exported_wh", "imported_wh"])
                ->map(fn ($r) => [
                    "time" => Carbon::parse($r->recorded_at)->setTimezone("Europe/Madrid")->format("H:i"),
                    "produced_wh" => (int) $r->produced_wh,
                    "consumed_wh" => (int) $r->consumed_wh,
                    "exported_wh" => (int) $r->exported_wh,
                    "imported_wh" => (int) $r->imported_wh,
                ])
                ->values();
        }

        $pvpc = PriceTick::where("source", "pvpc")->orderByDesc("recorded_at")->value("price_eur_kwh");

        $radiation = null;
        if ($user->address) {
            $radiation = $aemet->getNearestStationRadiation(
                (float) $user->address->lat,
                (float) $user->address->lon,
            );
        }

        return Inertia::render("home", [
            "devices" => $devices->map(fn ($d) => [
                "id" => $d->id,
                "type" => $d->type,
                "model" => $d->model,
                "serial_number" => $d->serial_number,
                "manufacturer" => $d->manufacturer,
                "installation_date" => $d->installation_date?->toDateString(),
                "status" => $d->status ?? 'active',
                "last_reading_at" => $d->last_reading_at?->toIso8601String(),
                "api_token" => $d->api_token,
                "created_at" => $d->created_at->toIso8601String(),
            ])->values(),
            "lastReading" => $lastReading ? [
                "recorded_at" => Carbon::parse($lastReading->recorded_at)->setTimezone("Europe/Madrid")->toIso8601String(),
                "produced_w" => (int) ($lastReading->produced_wh * 12), // 5-min interval → approximate W
                "consumed_w" => (int) ($lastReading->consumed_wh * 12),
                "exported_w" => (int) ($lastReading->exported_wh * 12),
                "imported_w" => (int) ($lastReading->imported_wh * 12),
                "produced_wh" => (int) $lastReading->produced_wh,
                "consumed_wh" => (int) $lastReading->consumed_wh,
                "exported_wh" => (int) $lastReading->exported_wh,
                "imported_wh" => (int) $lastReading->imported_wh,
                "voltage_v" => $lastReading->voltage_v ? (float) $lastReading->voltage_v : null,
                "frequency_hz" => $lastReading->frequency_hz ? (float) $lastReading->frequency_hz : null,
            ] : null,
            "todayReadings" => $todayReadings,
            "pvpcEurKwh" => $pvpc ? (float) $pvpc : null,
            "userType" => $user->user_type,
            "address" => $user->address ? [
                "cups" => $user->address->cups,
                "peak_power_kwp" => (float) $user->address->peak_power_kwp,
                "street" => $user->address->street,
            ] : null,
            "radiation" => $radiation,
        ]);
    }

    public function registerDevice(Request $request): RedirectResponse
    {
        $request->validate([
            "type" => ["required", "in:inverter,smart_meter,plc,simulator,ev_charger,battery_storage"],
            "model" => ["required", "string", "max:100"],
            "manufacturer" => ["nullable", "string", "max:100"],
            "serial_number" => ["nullable", "string", "max:100", "unique:devices,serial_number"],
            "installation_date" => ["nullable", "date", "before_or_equal:today"],
        ]);

        $request->user()->devices()->create([
            "type" => $request->type,
            "model" => $request->model,
            "manufacturer" => $request->manufacturer,
            "serial_number" => $request->serial_number,
            "installation_date" => $request->installation_date,
            "status" => "active",
            "api_token" => Str::random(64),
        ]);

        return back()->with("success", "Dispositivo registrado correctamente.");
    }

    public function deleteDevice(Request $request, Device $device): RedirectResponse
    {
        abort_if($device->user_id !== $request->user()->id, 403);
        $device->delete();

        return back()->with("success", "Dispositivo eliminado.");
    }

    public function regenerateToken(Request $request, Device $device): RedirectResponse
    {
        abort_if($device->user_id !== $request->user()->id, 403);
        $device->update(["api_token" => Str::random(64)]);

        return back()->with("success", "Token regenerado. Actualiza tu dispositivo con el nuevo token.");
    }

    public function toggleStatus(Request $request, Device $device): RedirectResponse
    {
        abort_if($device->user_id !== $request->user()->id, 403);
        $device->update(["status" => $device->status === "active" ? "inactive" : "active"]);

        return back()->with("success", $device->status === "active" ? "Dispositivo activado." : "Dispositivo desactivado.");
    }
}
