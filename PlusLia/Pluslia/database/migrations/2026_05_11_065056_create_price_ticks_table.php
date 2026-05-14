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
        Schema::create('price_ticks', function (Blueprint $table) {
            $table->id();
            $table->timestamp('recorded_at');
            $table->string('source');
            $table->decimal('price_eur_kwh', 10, 6);

            $table->index(['source', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_ticks');
    }
};
