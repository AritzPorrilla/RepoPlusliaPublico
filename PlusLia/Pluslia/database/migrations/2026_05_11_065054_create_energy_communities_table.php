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
        Schema::create('energy_communities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('centroid_lat', 10, 7);
            $table->decimal('centroid_lon', 10, 7);
            $table->unsignedInteger('max_distance_m')->default(5000);
            $table->string('sharing_policy')->default('proportional');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('energy_communities');
    }
};
