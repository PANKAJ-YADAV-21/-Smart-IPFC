<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IpApplication;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments.
     */
    public function index()
    {
        $user = Auth::user();
        if ($user->role === 'admin') {
            return response()->json(Payment::with(['user', 'ipApplication'])->latest()->paginate(10));
        }
        return response()->json(Payment::where('user_id', $user->id)->with('ipApplication')->latest()->paginate(10));
    }

    /**
     * Initiate a payment (Simulated Sandbox).
     */
    public function store(Request $request)
    {
        $request->validate([
            'ip_application_id' => 'required|exists:ip_applications,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
        ]);

        $application = IpApplication::findOrFail($request->ip_application_id);

        // Check if there is already a paid payment for this application
        $alreadyPaid = Payment::where('ip_application_id', $application->id)
            ->where('status', 'completed')
            ->exists();

        if ($alreadyPaid) {
            return response()->json(['message' => 'This application has already been paid for.'], 422);
        }

        // Create a pending transaction
        $payment = Payment::create([
            'user_id' => Auth::id(),
            'ip_application_id' => $application->id,
            'amount' => $request->amount,
            'currency' => 'INR',
            'transaction_id' => 'TXN-' . strtoupper(Str::random(12)),
            'payment_method' => $request->payment_method,
            'status' => 'pending',
            'payment_details' => [
                'simulated' => true,
                'gateway' => 'internal_sandbox',
                'created_at' => now()->toDateTimeString(),
            ]
        ]);

        // Update application payment status to pending
        $application->update([
            'payment_status' => 'pending',
            'payment_amount' => $request->amount
        ]);

        return response()->json([
            'message' => 'Payment initiated',
            'payment' => $payment,
            'client_secret' => 'sec_' . Str::random(24) // Simulated client secret for flow
        ], 201);
    }

    /**
     * Confirm a simulated payment.
     */
    public function confirm(Request $request, string $id)
    {
        $payment = Payment::findOrFail($id);

        if (Auth::user()->role === 'client' && $payment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($payment->status === 'completed') {
            return response()->json([
                'message' => 'Payment already completed', 
                'payment' => $payment->load('ipApplication')
            ]);
        }

        $request->validate([
            'otp' => 'nullable|string',
            'status' => 'nullable|string|in:completed,failed',
        ]);

        $status = $request->input('status', 'completed');
        
        $payment->status = $status;
        $details = $payment->payment_details;
        $details['confirmed_at'] = now()->toDateTimeString();
        $details['gateway_response'] = [
            'status' => $status,
            'message' => $status === 'completed' ? 'Simulated Sandbox payment succeeded' : 'Simulated Sandbox payment failed',
        ];
        $payment->payment_details = $details;
        $payment->save();

        $application = $payment->ipApplication;
        if ($application) {
            if ($status === 'completed') {
                $application->update([
                    'payment_status' => 'paid',
                    'payment_amount' => $payment->amount
                ]);

                // Create notification for applicant
                \App\Models\Notification::send(
                    $payment->user_id,
                    'Payment Successful',
                    "Statutory fee of ₹{$payment->amount} has been successfully paid for application \"{$application->title}\" ({$application->application_number}).",
                    'success'
                );
            } else {
                $application->update([
                    'payment_status' => 'failed'
                ]);

                \App\Models\Notification::send(
                    $payment->user_id,
                    'Payment Failed',
                    "Payment of ₹{$payment->amount} for application \"{$application->title}\" has failed. Please try again.",
                    'alert'
                );
            }
        }

        return response()->json([
            'message' => $status === 'completed' ? 'Payment confirmed successfully' : 'Payment marked as failed',
            'payment' => $payment->load('ipApplication')
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $payment = Payment::with(['user', 'ipApplication'])->findOrFail($id);
        
        if (Auth::user()->role === 'client' && $payment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($payment);
    }
}
