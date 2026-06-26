<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Register a User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'sometimes|string|in:client,staff,expert,admin',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'client',
            'is_approved' => ($request->role === 'staff' || $request->role === 'expert') ? false : true,
        ]);

        // Send standard email verification link
        try {
            $user->sendEmailVerificationNotification();
        } catch (\Exception $e) {
            // Log error or continue
        }

        return response()->json([
            'message' => 'A verification link has been sent to your email. Please verify your email to activate your account.',
            'user' => $user
        ], 201);
    }

    /**
     * Get a JWT via given credentials.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);
        $credentials = $request->only('email', 'password');

        $token = Auth::attempt($credentials);
        if (!$token) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }

        $user = Auth::user();

        // Strict Email Verification Check on Login
        if (!$user->hasVerifiedEmail()) {
            Auth::logout();
            return response()->json([
                'status' => 'error',
                'message' => 'Please verify your email before logging in.',
                'email' => $user->email
            ], 403);
        }

        // Staff Approval Check
        if (in_array($user->role, ['staff', 'expert']) && !$user->is_approved) {
            Auth::logout();
            return response()->json([
                'status' => 'error',
                'message' => 'Your staff account is pending admin approval. You will receive an email once approved.',
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'user' => $user,
            'authorisation' => [
                'token' => $token,
                'type' => 'bearer',
            ]
        ]);
    }

    /**
     * Log the user out (Invalidate the token).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        Auth::logout();
        return response()->json([
            'status' => 'success',
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Refresh a token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        return response()->json([
            'status' => 'success',
            'user' => Auth::user(),
            'authorisation' => [
                'token' => Auth::refresh(),
                'type' => 'bearer',
            ]
        ]);
    }

    /**
     * Get the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        return response()->json([
            'status' => 'success',
            'user' => Auth::user(),
        ]);
    }

    /**
     * Verify email address.
     */
    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::find($id);

        if (!$user) {
            return redirect('http://localhost:5173/login?error=invalid');
        }

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return redirect('http://localhost:5173/login?error=invalid');
        }

        // Check if URL signature is valid & not expired
        if (!$request->hasValidSignature()) {
            return redirect('http://localhost:5173/login?error=expired&email=' . urlencode($user->email));
        }

        if ($user->hasVerifiedEmail()) {
            return redirect('http://localhost:5173/login?verified=1');
        }

        $user->markEmailAsVerified();

        return redirect('http://localhost:5173/login?verified=1');
    }

    /**
     * Public endpoint to resend verification link.
     */
    public function resendVerificationPublic(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'No account found with this email.'], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent successfully.']);
    }

    /**
     * Resend standard verification email (Authenticated).
     */
    public function resendVerificationEmail(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent!']);
    }

    /**
     * Send OTP for Password Reset.
     */
    public function forgotPasswordOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'No account found with this email address.'], 404);
        }

        $otp = (string) random_int(100000, 999999);

        $user->update([
            'otp_code' => Hash::make($otp),
            'otp_expires_at' => now()->addMinutes(15)
        ]);

        try {
            Mail::raw("Your Password Reset OTP is: {$otp}. It expires in 15 minutes.", function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Password Reset OTP');
            });
        } catch (\Exception $e) {
            // Continue
        }

        return response()->json(['message' => 'Reset OTP sent successfully to your email.']);
    }

    /**
     * Reset Password via OTP code.
     */
    public function resetPasswordOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        if (!$user->otp_code || !$user->otp_expires_at) {
            return response()->json(['message' => 'No active OTP request.'], 400);
        }

        if (now()->greaterThan($user->otp_expires_at)) {
            return response()->json(['message' => 'OTP has expired.'], 400);
        }

        if (!Hash::check($request->otp, $user->otp_code)) {
            return response()->json(['message' => 'Invalid OTP.'], 400);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'otp_code' => null,
            'otp_expires_at' => null
        ]);

        return response()->json(['message' => 'Password reset successfully. You can now log in.']);
    }
}
