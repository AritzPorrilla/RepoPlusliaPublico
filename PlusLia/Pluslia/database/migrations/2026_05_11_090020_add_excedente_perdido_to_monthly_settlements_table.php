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
        Schema::table('monthly_settlements', function (Blueprint $table) {
            $table->decimal('excedente_perdido_eur', 10, 4)->default(0)->after('balance_eur');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_settlements', function (Blueprint $table) {
            $table->dropColumn('excedente_perdido_eur');
        });
    }
};
