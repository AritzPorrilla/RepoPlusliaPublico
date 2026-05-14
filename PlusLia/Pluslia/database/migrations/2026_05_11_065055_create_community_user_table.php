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
        Schema::create('community_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('community_id')->constrained('energy_communities')->cascadeOnDelete();
            $table->timestamp('joined_at')->useCurrent();
            $table->decimal('sharing_coefficient', 8, 6)->default(0);
            $table->string('status')->default('active');
            $table->unique(['user_id', 'community_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('community_user');
    }
};
