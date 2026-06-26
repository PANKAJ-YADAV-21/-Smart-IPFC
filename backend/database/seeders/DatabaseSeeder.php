<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin
        User::create([
            'name' => 'System Administrator',
            'email' => 'admin@ipfcms.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // Legal Expert
        User::create([
            'name' => 'Dr. Sarah Legal',
            'email' => 'expert@ipfcms.com',
            'password' => Hash::make('password123'),
            'role' => 'expert',
        ]);

        // Staff
        User::create([
            'name' => 'Mark Staff',
            'email' => 'staff@ipfcms.com',
            'password' => Hash::make('password123'),
            'role' => 'staff',
        ]);

        // Client
        User::create([
            'name' => 'John Applicant',
            'email' => 'client@ipfcms.com',
            'password' => Hash::make('password123'),
            'role' => 'client',
        ]);
    }
}
