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
        Schema::table('users', function (Blueprint $table) {
            $table->string('tariff')->default('2.0TD')->after('email');
            $table->decimal('contracted_power_kw', 6, 2)->nullable()->after('tariff');
            $table->decimal('annual_consumption_kwh', 10, 2)->nullable()->after('contracted_power_kw');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['tariff', 'contracted_power_kw', 'annual_consumption_kwh']);
        });
    }
};
