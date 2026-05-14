<?php

namespace App\Mail;

use App\Models\MonthlySettlement;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MonthlySettlementMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly MonthlySettlement $settlement) {}

    public function envelope(): Envelope
    {
        $month = $this->settlement->month->translatedFormat('F Y');

        return new Envelope(
            subject: "Pluslia — Liquidación mensual {$month}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'invoices.monthly',
            with: ['settlement' => $this->settlement],
        );
    }

    public function attachments(): array
    {
        if (! $this->settlement->pdf_path) {
            return [];
        }

        return [
            Attachment::fromStorageDisk('local', $this->settlement->pdf_path)
                ->as("liquidacion-{$this->settlement->month->format('Y-m')}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
