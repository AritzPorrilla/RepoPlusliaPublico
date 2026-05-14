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
        Schema::table('energy_communities', function (Blueprint $table) {
            $table->string('nif', 12)->nullable()->after('invite_code');
            $table->string('legal_type')->nullable()->after('nif'); // cooperativa | asociacion | sl
            $table->text('description')->nullable()->after('legal_type');
        });
    }

    public function down(): void
    {
        Schema::table('energy_communities', function (Blueprint $table) {
            $table->dropColumn(['nif', 'legal_type', 'description']);
        });
    }
};
