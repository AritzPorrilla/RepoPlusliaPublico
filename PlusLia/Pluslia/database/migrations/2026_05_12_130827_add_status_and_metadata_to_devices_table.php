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
        Schema::table('devices', function (Blueprint $table) {
            $table->string('serial_number')->nullable()->unique()->after('model');
            $table->string('manufacturer')->nullable()->after('serial_number');
            $table->date('installation_date')->nullable()->after('manufacturer');
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active')->after('installation_date');
            $table->timestamp('last_reading_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropColumn(['serial_number', 'manufacturer', 'installation_date', 'status', 'last_reading_at']);
        });
    }
};
