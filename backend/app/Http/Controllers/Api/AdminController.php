<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IpApplication;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Get system-wide analytics stats for Dashboard charts.
     */
    public function getAnalytics()
    {
        $totalApps = IpApplication::count();
        $statusCounts = IpApplication::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get();
            
        $typeCounts = IpApplication::select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->get();

        $totalRevenue = Payment::where('status', 'successful')->sum('amount');

        // Monthly trend (last 6 months)
        $monthlyTrend = IpApplication::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('count(*) as total')
        )
        ->groupBy('month')
        ->orderBy('month', 'desc')
        ->limit(6)
        ->get();

        return response()->json([
            'total_applications' => $totalApps,
            'status_counts' => $statusCounts,
            'type_counts' => $typeCounts,
            'total_revenue' => $totalRevenue,
            'monthly_trend' => $monthlyTrend
        ]);
    }

    /**
     * Get list of all registered users.
     */
    public function getUsers()
    {
        $users = User::select('id', 'name', 'email', 'role', 'is_approved', 'created_at')->latest()->get();
        return response()->json($users);
    }

    /**
     * Approve a staff or expert user account.
     */
    public function approveUser($id)
    {
        $user = User::findOrFail($id);
        
        if (in_array($user->role, ['staff', 'expert'])) {
            $user->update(['is_approved' => true]);
            return response()->json(['message' => 'User approved successfully.', 'user' => $user]);
        }

        return response()->json(['message' => 'Only staff or experts require approval.'], 400);
    }
}
