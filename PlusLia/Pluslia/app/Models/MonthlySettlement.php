<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'month', 'total_imported_kwh', 'total_exported_kwh', 'total_p2p_buy_kwh', 'total_p2p_sell_kwh', 'balance_eur', 'excedente_perdido_eur', 'pdf_path'])]
class MonthlySettlement extends Model
{
    protected function casts(): array
    {
        return [
            'month' => 'date',
            'total_imported_kwh' => 'decimal:3',
            'total_exported_kwh' => 'decimal:3',
            'total_p2p_buy_kwh' => 'decimal:3',
            'total_p2p_sell_kwh' => 'decimal:3',
            'balance_eur' => 'decimal:4',
            'excedente_perdido_eur' => 'decimal:4',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
