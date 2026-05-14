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
        Schema::create('daily_aggregates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('day');
            $table->decimal('produced_kwh', 10, 3)->default(0);
            $table->decimal('consumed_kwh', 10, 3)->default(0);
            $table->decimal('surplus_kwh', 10, 3)->default(0);
            $table->decimal('savings_eur', 10, 4)->default(0);
            $table->decimal('p2p_sold_kwh', 10, 3)->default(0);
            $table->decimal('p2p_bought_kwh', 10, 3)->default(0);
            $table->decimal('grid_exported_kwh', 10, 3)->default(0);
            $table->decimal('grid_imported_kwh', 10, 3)->default(0);

            $table->unique(['user_id', 'day']);
            $table->index('day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_aggregates');
    }
};
