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

        $totalRevenue = Payment::where('status', 'completed')
            ->orWhere('status', 'successful')
            ->sum('amount');

        // SQLite & MySQL compatible monthly trend (last 6 months)
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $monthFormat = $isSqlite 
            ? "strftime('%Y-%m', created_at)" 
            : "DATE_FORMAT(created_at, '%Y-%m')";

        $monthlyTrend = IpApplication::select(
            DB::raw("{$monthFormat} as month"),
            DB::raw('count(*) as total')
        )
        ->groupBy('month')
        ->orderBy('month', 'desc')
        ->limit(6)
        ->get();

        // Monthly revenue trends
        $monthlyRevenue = Payment::select(
            DB::raw("{$monthFormat} as month"),
            DB::raw('sum(amount) as total')
        )
        ->whereIn('status', ['completed', 'successful'])
        ->groupBy('month')
        ->orderBy('month', 'desc')
        ->limit(6)
        ->get();

        // Revenue breakdown by IP type
        $revenueByType = Payment::join('ip_applications', 'payments.ip_application_id', '=', 'ip_applications.id')
            ->select('ip_applications.type', DB::raw('sum(payments.amount) as total'))
            ->whereIn('payments.status', ['completed', 'successful'])
            ->groupBy('ip_applications.type')
            ->get();

        // Expert workloads
        $appointmentStatusCounts = DB::table('appointments')
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get();

        $expertWorkloads = DB::table('appointments')
            ->join('users', 'appointments.expert_id', '=', 'users.id')
            ->select('users.name', DB::raw('count(*) as total'))
            ->whereIn('appointments.status', ['pending', 'approved', 'scheduled'])
            ->groupBy('users.name')
            ->get();

        // Average processing time in days (average duration from submitted to Approved)
        $approvalTimes = [];
        $completedApplications = IpApplication::whereIn('status', ['Approved by Staff', 'Approved', 'granted', 'submitted'])->get();
        foreach ($completedApplications as $app) {
            $history = DB::table('workflow_histories')
                ->where('ip_application_id', $app->id)
                ->orderBy('created_at', 'asc')
                ->get();
            
            $submittedTime = null;
            $approvedTime = null;
            foreach ($history as $h) {
                if ($h->to_status === 'submitted') {
                    $submittedTime = strtotime($h->created_at);
                }
                if (in_array($h->to_status, ['Approved by Staff', 'Approved', 'granted'])) {
                    $approvedTime = strtotime($h->created_at);
                }
            }
            if ($submittedTime && $approvedTime) {
                $approvalTimes[] = ($approvedTime - $submittedTime) / 86400; // in days
            }
        }
        $avgProcessingDays = count($approvalTimes) > 0 
            ? round(array_sum($approvalTimes) / count($approvalTimes), 1) 
            : 0;

        return response()->json([
            'total_applications' => $totalApps,
            'status_counts' => $statusCounts,
            'type_counts' => $typeCounts,
            'total_revenue' => $totalRevenue,
            'monthly_trend' => $monthlyTrend,
            'monthly_revenue' => $monthlyRevenue,
            'revenue_by_type' => $revenueByType,
            'appointment_status_counts' => $appointmentStatusCounts,
            'expert_workloads' => $expertWorkloads,
            'avg_processing_days' => $avgProcessingDays
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
