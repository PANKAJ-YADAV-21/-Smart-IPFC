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
        Schema::table('ip_applications', function (Blueprint $table) {
            $table->string('registration_id')->nullable()->after('application_number');
            $table->date('expiry_date')->nullable()->after('registration_id');
            $table->timestamp('granted_at')->nullable()->after('expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ip_applications', function (Blueprint $table) {
            $table->dropColumn(['registration_id', 'expiry_date', 'granted_at']);
        });
    }
};
