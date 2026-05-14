<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class WaveshareConfigController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('devices/waveshare-config');
    }
}
