<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_diagnoses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained('energy_communities')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('roof_m2', 8, 2)->nullable();
            $table->decimal('monthly_kwh', 8, 2)->nullable();
            $table->enum('interest_level', ['high', 'medium', 'low'])->default('high');
            $table->boolean('has_own_panels')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['community_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_diagnoses');
    }
};
