<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('energy_communities', function (Blueprint $table) {
            $table->string('invite_code', 8)->nullable()->unique()->after('name');
        });

        DB::table('energy_communities')->whereNull('invite_code')->orderBy('id')->each(function ($community) {
            do {
                $code = strtoupper(Str::random(8));
            } while (DB::table('energy_communities')->where('invite_code', $code)->exists());

            DB::table('energy_communities')->where('id', $community->id)->update(['invite_code' => $code]);
        });

        Schema::table('energy_communities', function (Blueprint $table) {
            $table->string('invite_code', 8)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('energy_communities', function (Blueprint $table) {
            $table->dropColumn('invite_code');
        });
    }
};
