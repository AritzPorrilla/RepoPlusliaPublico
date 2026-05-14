<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('monthly_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('month');
            $table->decimal('total_imported_kwh', 10, 3)->default(0);
            $table->decimal('total_exported_kwh', 10, 3)->default(0);
            $table->decimal('total_p2p_buy_kwh', 10, 3)->default(0);
            $table->decimal('total_p2p_sell_kwh', 10, 3)->default(0);
            $table->decimal('balance_eur', 10, 4)->default(0);
            $table->string('pdf_path')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_settlements');
    }
};
