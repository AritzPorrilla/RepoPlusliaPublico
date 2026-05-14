<?php

namespace App\Listeners;

use App\Events\MonthlySettlementClosed;
use App\Mail\MonthlySettlementMail;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class GenerateInvoicePdfListener implements ShouldQueue
{
    public function handle(MonthlySettlementClosed $event): void
    {
        $settlement = $event->settlement->load('user');
        $month = $settlement->month->format('Y-m');

        $pdf = Pdf::loadView('invoices.monthly', ['settlement' => $settlement]);

        $path = "invoices/{$settlement->user_id}/{$month}.pdf";
        Storage::put($path, $pdf->output());

        $settlement->update(['pdf_path' => $path]);

        Mail::to($settlement->user->email)
            ->queue(new MonthlySettlementMail($settlement));
    }
}
