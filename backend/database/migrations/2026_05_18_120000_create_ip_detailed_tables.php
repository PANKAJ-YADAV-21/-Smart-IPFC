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
        Schema::create('applicants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ip_application_id')->constrained()->onDelete('cascade');
            $table->string('full_name');
            $table->string('company_name')->nullable();
            $table->string('applicant_type'); // individual, startup, MSME, others
            $table->string('nationality');
            $table->text('address');
            $table->string('email');
            $table->string('phone_number');
            $table->timestamps();
        });

        Schema::create('patents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ip_application_id')->constrained()->onDelete('cascade');
            $table->string('patent_type'); // provisional, complete
            $table->string('technical_category');
            $table->string('filing_type');
            $table->string('technical_domain');
            
            // Detailed specs
            $table->text('abstract')->nullable();
            $table->text('background')->nullable();
            $table->text('problem_statement')->nullable();
            $table->text('limitations')->nullable();
            $table->text('detailed_description')->nullable();
            $table->text('novelty')->nullable();
            $table->text('advantages')->nullable();
            $table->text('applicability')->nullable();
            
            // Claims
            $table->text('independent_claims')->nullable();
            $table->text('dependent_claims')->nullable();
            $table->timestamps();
        });

        Schema::create('trademarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ip_application_id')->constrained()->onDelete('cascade');
            $table->string('trademark_type');
            $table->string('industry_category');
            $table->string('goods_category');
            
            // Details
            $table->text('brand_description')->nullable();
            $table->text('trademark_meaning')->nullable();
            $table->text('usage_purpose')->nullable();
            $table->date('first_use_date')->nullable();
            $table->timestamps();
        });

        Schema::create('copyrights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ip_application_id')->constrained()->onDelete('cascade');
            $table->string('work_type'); // software, music, book, video, artwork, photograph, research_paper
            $table->text('description')->nullable();
            $table->date('creation_date')->nullable();
            $table->date('publication_date')->nullable();
            $table->string('owner_name')->nullable();
            $table->timestamps();
        });

        Schema::create('industrial_designs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ip_application_id')->constrained()->onDelete('cascade');
            $table->string('product_category');
            $table->string('industry_sector');
            $table->string('design_category');
            
            // Details
            $table->text('description')->nullable();
            $table->text('shape_details')->nullable();
            $table->text('pattern_details')->nullable();
            $table->text('ornamentation_details')->nullable();
            $table->text('material_details')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('industrial_designs');
        Schema::dropIfExists('copyrights');
        Schema::dropIfExists('trademarks');
        Schema::dropIfExists('patents');
        Schema::dropIfExists('applicants');
    }
};
