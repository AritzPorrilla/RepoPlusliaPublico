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
        Schema::create('energy_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->timestamp('recorded_at');
            $table->unsignedInteger('produced_wh')->default(0);
            $table->unsignedInteger('consumed_wh')->default(0);
            $table->unsignedInteger('exported_wh')->default(0);
            $table->unsignedInteger('imported_wh')->default(0);
            $table->decimal('voltage_v', 6, 2)->nullable();
            $table->decimal('frequency_hz', 6, 3)->nullable();

            $table->index(['device_id', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('energy_readings');
    }
};
