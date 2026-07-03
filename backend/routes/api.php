<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IpApplicationController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\ChatMessageController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\NotificationController;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::post('forgot-password', [AuthController::class, 'forgotPasswordOtp']);
Route::post('reset-password', [AuthController::class, 'resetPasswordOtp']);

// Public Signed Email Verification URL (accessed from Gmail)
Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');
Route::post('email/resend-public', [AuthController::class, 'resendVerificationPublic']);

Route::middleware('auth:api')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me']);
    
    Route::post('email/resend', [AuthController::class, 'resendVerificationEmail']);

    // IP Applications
    Route::apiResource('applications', IpApplicationController::class);
    Route::patch('applications/{id}/status', [IpApplicationController::class, 'updateStatus']);
    Route::post('applications/{id}/review', [IpApplicationController::class, 'submitReview']);

    // Documents
    Route::apiResource('documents', DocumentController::class);
    Route::get('documents/{id}/download', [DocumentController::class, 'download']);

    // Payments
    Route::apiResource('payments', PaymentController::class);
    Route::post('payments/{id}/confirm', [PaymentController::class, 'confirm']);

    // Appointments
    Route::apiResource('appointments', AppointmentController::class)->only(['index', 'store', 'destroy']);
    Route::patch('appointments/{id}/status', [AppointmentController::class, 'updateStatus']);

    // Chat Messages
    Route::get('chat/threads', [ChatMessageController::class, 'threads']);
    Route::post('chat/read-all', [ChatMessageController::class, 'markAllAsRead']);
    Route::get('chat/attachments/{id}', [ChatMessageController::class, 'downloadAttachment']);
    Route::apiResource('chat', ChatMessageController::class)->only(['index', 'store']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('notifications', [NotificationController::class, 'clearAll']);
});

// Role-based routes
Route::middleware(['auth:api', 'role:admin'])->group(function () {
    Route::get('/admin/analytics', [AdminController::class, 'getAnalytics']);
    Route::get('/admin/users', [AdminController::class, 'getUsers']);
    Route::patch('/admin/users/{id}/approve', [AdminController::class, 'approveUser']);
});
