<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IpApplication;
use App\Models\Applicant;
use App\Models\Patent;
use App\Models\Trademark;
use App\Models\Copyright;
use App\Models\IndustrialDesign;
use App\Models\WorkflowHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IpApplicationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = IpApplication::with(['user', 'applicant', 'patent', 'trademark', 'copyright', 'industrialDesign', 'documents', 'workflowHistory']);

        // RBAC Filter
        if ($user->role === 'client') {
            $query->where('user_id', $user->id);
        }

        // Search/Filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('application_number', 'like', '%' . $search . '%');
            });
        }

        return response()->json($query->latest()->paginate(10));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:patent,trademark,copyright,design',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $application = IpApplication::create([
                'user_id' => Auth::id(),
                'application_number' => 'APP-' . strtoupper(Str::random(8)),
                'type' => $request->type,
                'status' => 'draft',
                'title' => $request->title,
                'description' => $request->description,
            ]);

            // Initialize detail sub-records with defaults
            Applicant::create([
                'ip_application_id' => $application->id,
                'full_name' => Auth::user()->name,
                'applicant_type' => 'individual',
                'nationality' => 'Indian',
                'address' => 'N/A',
                'email' => Auth::user()->email,
                'phone_number' => '0000000000',
            ]);

            if ($request->type === 'patent') {
                Patent::create([
                    'ip_application_id' => $application->id,
                    'patent_type' => 'provisional',
                    'technical_category' => 'Software',
                    'filing_type' => 'ordinary',
                    'technical_domain' => 'Information Technology',
                ]);
            } elseif ($request->type === 'trademark') {
                Trademark::create([
                    'ip_application_id' => $application->id,
                    'trademark_type' => 'wordmark',
                    'industry_category' => 'Technology',
                    'goods_category' => 'Class 9',
                ]);
            } elseif ($request->type === 'copyright') {
                Copyright::create([
                    'ip_application_id' => $application->id,
                    'work_type' => 'software',
                    'owner_name' => Auth::user()->name,
                ]);
            } elseif ($request->type === 'design') {
                IndustrialDesign::create([
                    'ip_application_id' => $application->id,
                    'product_category' => 'Electronics',
                    'industry_sector' => 'Consumer Hardware',
                    'design_category' => 'Class 14',
                ]);
            }

            return response()->json($application->load(['applicant', 'patent', 'trademark', 'copyright', 'industrialDesign']), 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $application = IpApplication::with([
            'user', 
            'documents', 
            'workflowHistory', 
            'applicant', 
            'patent', 
            'trademark', 
            'copyright', 
            'industrialDesign'
        ])->findOrFail($id);
        
        // RBAC check
        if (Auth::user()->role === 'client' && $application->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($application);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $application = IpApplication::findOrFail($id);

        if (Auth::user()->role === 'client' && $application->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return DB::transaction(function () use ($request, $application) {
            // Update base info
            if ($request->has('title')) $application->title = $request->title;
            if ($request->has('description')) $application->description = $request->description;
            if ($request->has('status')) $application->status = $request->status;
            if ($request->has('payment_status')) $application->payment_status = $request->payment_status;
            if ($request->has('payment_amount')) $application->payment_amount = $request->payment_amount;
            $application->save();

            // Update applicant details
            if ($request->has('applicant')) {
                $applicantData = $request->applicant;
                $application->applicant()->updateOrCreate(
                    ['ip_application_id' => $application->id],
                    $applicantData
                );
            }

            // Update Patent details
            if ($application->type === 'patent' && $request->has('patent')) {
                $patentData = $request->patent;
                $application->patent()->updateOrCreate(
                    ['ip_application_id' => $application->id],
                    $patentData
                );
            }

            // Update Trademark details
            if ($application->type === 'trademark' && $request->has('trademark')) {
                $trademarkData = $request->trademark;
                $application->trademark()->updateOrCreate(
                    ['ip_application_id' => $application->id],
                    $trademarkData
                );
            }

            // Update Copyright details
            if ($application->type === 'copyright' && $request->has('copyright')) {
                $copyrightData = $request->copyright;
                $application->copyright()->updateOrCreate(
                    ['ip_application_id' => $application->id],
                    $copyrightData
                );
            }

            // Update Industrial Design details
            if ($application->type === 'design' && $request->has('design')) {
                $designData = $request->design;
                $application->industrialDesign()->updateOrCreate(
                    ['ip_application_id' => $application->id],
                    $designData
                );
            }

            return response()->json($application->load(['applicant', 'patent', 'trademark', 'copyright', 'industrialDesign']));
        });
    }

    /**
     * Update application status (Workflow).
     */
    public function updateStatus(Request $request, string $id)
    {
        $request->validate([
            'status' => 'required|string',
            'remarks' => 'nullable|string',
        ]);

        $application = IpApplication::findOrFail($id);
        $oldStatus = $application->status;
        
        // Reset old rejections so staff gets a clean review slate upon client resubmission
        $feedbacks = $application->field_feedbacks;
        if ($request->status === 'Pending Review' && is_array($feedbacks)) {
            foreach ($feedbacks as $field => $data) {
                if (isset($data['status']) && $data['status'] === 'rejected') {
                    unset($feedbacks[$field]);
                }
            }
        }

        $updateData = [
            'status' => $request->status,
            'field_feedbacks' => $feedbacks,
            'submitted_at' => ($request->status === 'submitted' && !$application->submitted_at) ? now() : $application->submitted_at
        ];

        // Generate Patent / IP registration details if admin approves the application
        if ($request->status === 'Approved' && !$application->registration_id) {
            $year = date('Y');
            $rand = rand(100000, 999999);
            $prefix = match ($application->type) {
                'patent' => 'IN-PAT',
                'trademark' => 'IN-TM',
                'copyright' => 'IN-CR',
                'design' => 'IN-DS',
                default => 'IN-IP'
            };
            $updateData['registration_id'] = "{$prefix}-{$year}-{$rand}";
            
            $yearsToAdd = match ($application->type) {
                'patent' => 20,
                'trademark' => 10,
                'design' => 15,
                'copyright' => 60,
                default => 10
            };
            $updateData['expiry_date'] = now()->addYears($yearsToAdd);
            $updateData['granted_at'] = now();
        }

        $application->update($updateData);

        // Send Notification to Client
        $notifTitle = match ($request->status) {
            'Approved' => 'IP Application Granted!',
            'Approved by Staff' => 'Filing Approved by Staff',
            'Corrections Requested' => 'Correction Required on IP Filing',
            default => 'IP Filing Status Updated'
        };
        $notifType = match ($request->status) {
            'Approved' => 'success',
            'Approved by Staff' => 'success',
            'Corrections Requested' => 'alert',
            default => 'info'
        };
        $notifDesc = "Your IP application \"{$application->title}\" ({$application->application_number}) has been updated to status: {$request->status}." . ($request->remarks ? " Reviewer comment: \"{$request->remarks}\"" : "");
        \App\Models\Notification::send($application->user_id, $notifTitle, $notifDesc, $notifType);

        // Notify Staff if client resubmits corrections
        if ($request->status === 'Pending Review') {
            $staffUsers = \App\Models\User::whereIn('role', ['staff', 'admin'])->get();
            foreach ($staffUsers as $su) {
                \App\Models\Notification::send($su->id, "IP Filing Resubmitted", "Client has resubmitted corrections for \"{$application->title}\" ({$application->application_number}).", 'info');
            }
        }

        // Notify Staff if client submits a new filing for the first time
        if ($request->status === 'submitted') {
            $staffUsers = \App\Models\User::whereIn('role', ['staff', 'admin'])->get();
            foreach ($staffUsers as $su) {
                \App\Models\Notification::send($su->id, "New IP Filing Submitted", "A new {$application->type} filing \"{$application->title}\" ({$application->application_number}) has been submitted for review.", 'info');
            }
        }

        // Log Workflow History
        WorkflowHistory::create([
            'ip_application_id' => $application->id,
            'user_id' => Auth::id(),
            'from_status' => $oldStatus,
            'to_status' => $request->status,
            'remarks' => $request->remarks
        ]);

        return response()->json([
            'message' => 'Status updated successfully',
            'application' => $application
        ]);
    }

    /**
     * Submit comprehensive field-level review.
     */
    public function submitReview(Request $request, string $id)
    {
        $request->validate([
            'field_feedbacks' => 'required|array',
            'remarks' => 'nullable|string'
        ]);

        $application = IpApplication::findOrFail($id);
        $feedbacks = $request->field_feedbacks;
        
        // Clean up feedback entries for documents that have been deleted by the client
        $existingDocIds = $application->documents()->pluck('id')->toArray();
        if (is_array($feedbacks)) {
            foreach ($feedbacks as $field => $data) {
                if (strpos($field, 'document.') === 0) {
                    $docId = (int) substr($field, 9);
                    if (!in_array($docId, $existingDocIds)) {
                        unset($feedbacks[$field]);
                    }
                }
            }
        }
        
        // Check if any field is rejected
        $hasRejections = false;
        foreach ($feedbacks as $field => $data) {
            if (isset($data['status']) && $data['status'] === 'rejected') {
                $hasRejections = true;
                break;
            }
        }

        $newStatus = $hasRejections ? 'Corrections Requested' : 'Approved by Staff';
        $oldStatus = $application->status;
        
        $application->update([
            'field_feedbacks' => $feedbacks,
            'status' => $newStatus
        ]);

        // Send Notification to Client
        $notifTitle = $hasRejections ? 'Correction Required on IP Filing' : 'Filing Approved by Staff';
        $notifType = $hasRejections ? 'alert' : 'success';
        $notifDesc = $hasRejections 
            ? "Staff completed review for \"{$application->title}\" ({$application->application_number}) and requested corrections on specific fields." 
            : "Staff completed review for \"{$application->title}\" ({$application->application_number}) and approved it. Awaiting final Admin/Gov approval.";
        if ($request->remarks) {
            $notifDesc .= " Comments: \"{$request->remarks}\"";
        }
        \App\Models\Notification::send($application->user_id, $notifTitle, $notifDesc, $notifType);

        WorkflowHistory::create([
            'ip_application_id' => $application->id,
            'user_id' => Auth::id(),
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'remarks' => $request->remarks ?? ($hasRejections ? 'Corrections requested based on field-level review.' : 'Application review completed and formally approved.')
        ]);

        return response()->json([
            'message' => 'Review submitted successfully',
            'application' => $application
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $application = IpApplication::findOrFail($id);
        
        if (Auth::user()->role === 'client' && $application->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $application->delete();
        return response()->json(['message' => 'Application deleted']);
    }
}
