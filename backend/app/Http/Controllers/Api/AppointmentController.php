<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    /**
     * Display a listing of appointments.
     */
    public function index()
    {
        $user = Auth::user();
        if ($user->role === 'admin' || $user->role === 'staff' || $user->role === 'expert') {
            return response()->json(Appointment::with(['client', 'expert'])->latest()->get());
        }
        return response()->json(Appointment::where('client_id', $user->id)->with('expert')->latest()->get());
    }

    /**
     * Book a new appointment.
     */
    public function store(Request $request)
    {
        $request->validate([
            'appointment_date' => 'required|date|after:now',
            'type' => 'required|in:online,offline',
            'notes' => 'nullable|string|max:1000',
        ]);

        $date = new \DateTime($request->appointment_date);
        
        // Enforce working hours (9:00 to 16:00)
        $hour = (int)$date->format('H');
        $minute = (int)$date->format('i');
        $dayOfWeek = (int)$date->format('N'); // 1 (Monday) to 7 (Sunday)

        if ($dayOfWeek > 5) {
            return response()->json([
                'message' => 'Appointments can only be booked from Monday to Friday.'
            ], 422);
        }

        if ($hour < 9 || $hour >= 16) {
            return response()->json([
                'message' => 'Appointments can only be booked during working hours (9:00 AM to 4:00 PM).'
            ], 422);
        }

        $appointment = Appointment::create([
            'client_id' => Auth::id(),
            'appointment_date' => $request->appointment_date,
            'type' => $request->type,
            'status' => 'pending',
            'notes' => $request->notes,
            'meeting_link' => $request->type === 'online' ? 'https://meet.google.com/' . substr(md5(uniqid()), 0, 10) : null,
        ]);

        // Notify Staff and Admins that a new appointment has been requested
        $staffUsers = \App\Models\User::whereIn('role', ['staff', 'admin'])->get();
        foreach ($staffUsers as $su) {
            \App\Models\Notification::send(
                $su->id,
                "New Consultation Requested",
                "Client \"" . Auth::user()->name . "\" requested a consultation on " . new \DateTime($request->appointment_date) . ".",
                'info'
            );
        }

        return response()->json($appointment, 201);
    }

    /**
     * Update appointment status (Approve/Reject).
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'nullable|string|max:1000',
        ]);

        $appointment = Appointment::findOrFail($id);

        if ($request->status === 'rejected' && !$request->rejection_reason) {
            return response()->json([
                'message' => 'Please provide a reason for rejecting the appointment.'
            ], 422);
        }

        $appointment->update([
            'status' => $request->status,
            'rejection_reason' => $request->status === 'rejected' ? $request->rejection_reason : null,
            'expert_id' => Auth::id(), // Staff who took action
        ]);

        // Notify Client of the decision
        $notifTitle = $request->status === 'approved' ? 'Consultation Approved!' : 'Consultation Rejected';
        $notifType = $request->status === 'approved' ? 'success' : 'alert';
        $notifDesc = $request->status === 'approved'
            ? "Your consultation scheduled for " . new \DateTime($appointment->appointment_date) . " has been approved." . ($appointment->meeting_link ? " Meeting Link: {$appointment->meeting_link}" : "")
            : "Your consultation scheduled for " . new \DateTime($appointment->appointment_date) . " was rejected. Reason: \"{$request->rejection_reason}\"";

        \App\Models\Notification::send($appointment->client_id, $notifTitle, $notifDesc, $notifType);

        return response()->json([
            'message' => "Appointment {$request->status} successfully.",
            'appointment' => $appointment
        ]);
    }

    /**
     * Cancel an appointment.
     */
    public function destroy($id)
    {
        $appointment = Appointment::findOrFail($id);

        if (Auth::user()->role === 'client' && $appointment->client_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointment->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Appointment successfully cancelled.', 'appointment' => $appointment]);
    }
}
