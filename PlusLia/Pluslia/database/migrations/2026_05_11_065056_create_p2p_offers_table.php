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
        Schema::create('p2p_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producer_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('price_eur_kwh', 10, 6);
            $table->decimal('kwh_available', 10, 3);
            $table->timestamp('valid_until');
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['status', 'valid_until']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('p2p_offers');
    }
};
