<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if there are any existing admins and remove them or just ensure this is the only one.
        User::where('role', 'admin')->delete();

        User::create([
            'name' => 'System Administrator',
            'email' => 'admin.ipfcms@gmail.com',
            'password' => Hash::make('Password123'),
            'role' => 'admin',
            'is_approved' => true,
            'email_verified_at' => now(), // Admin is auto-verified
        ]);
    }
}
