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
        Schema::create('ip_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('application_number')->unique();
            $table->enum('type', ['patent', 'trademark', 'copyright', 'design']);
            $table->string('status')->default('draft');
            $table->string('title');
            
            // Common/Specific fields (nullable)
            $table->text('description')->nullable();
            $table->text('abstract')->nullable();
            $table->text('claims')->nullable();
            $table->json('inventor_details')->nullable();
            $table->string('category')->nullable(); // Technical/Business category
            $table->string('brand_name')->nullable(); // Trademark
            $table->string('work_type')->nullable(); // Copyright work type
            
            $table->decimal('payment_amount', 10, 2)->default(0.00);
            $table->string('payment_status')->default('pending');
            
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ip_applications');
    }
};
