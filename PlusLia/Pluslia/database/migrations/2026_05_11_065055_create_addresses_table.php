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
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('street');
            $table->decimal('lat', 10, 7);
            $table->decimal('lon', 10, 7);
            $table->string('cups', 22)->unique();
            $table->decimal('peak_power_kwp', 8, 2)->nullable();
            $table->string('panel_orientation', 2)->nullable();
            $table->decimal('panel_inclination_deg', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
