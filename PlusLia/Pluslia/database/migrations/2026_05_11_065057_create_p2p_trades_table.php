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
        Schema::create('p2p_trades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('consumer_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('kwh', 10, 3);
            $table->decimal('price_eur_kwh', 10, 6);
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index('recorded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('p2p_trades');
    }
};
