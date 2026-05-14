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
        Schema::create('community_polls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained('energy_communities')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['yes_no', 'multiple'])->default('yes_no');
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamp('closes_at')->nullable();
            $table->timestamps();
            $table->index('community_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('community_polls');
    }
};
