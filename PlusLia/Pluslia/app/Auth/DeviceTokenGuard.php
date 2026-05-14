<?php

namespace App\Auth;

use App\Models\Device;
use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

class DeviceTokenGuard implements Guard
{
    use GuardHelpers;

    public function __construct(private readonly Request $request) {}

    public function user(): ?Device
    {
        if ($this->user !== null) {
            return $this->user;
        }

        $token = $this->request->bearerToken();

        if (! $token) {
            return null;
        }

        return $this->user = Device::where('api_token', $token)->first();
    }

    public function validate(array $credentials = []): bool
    {
        return Device::where('api_token', $credentials['api_token'] ?? '')->exists();
    }
}
