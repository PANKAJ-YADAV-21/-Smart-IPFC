<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get target user notifications.
     */
    public function index()
    {
        return response()->json(
            Notification::where('user_id', Auth::id())
                ->latest()
                ->get()
        );
    }

    /**
     * Mark single notification as read.
     */
    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', Auth::id())->findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json([
            'message' => 'Notification marked as read', 
            'notification' => $notification
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        Notification::where('user_id', Auth::id())->update(['is_read' => true]);
        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Delete notification.
     */
    public function destroy($id)
    {
        $notification = Notification::where('user_id', Auth::id())->findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    /**
     * Clear all notifications for user.
     */
    public function clearAll()
    {
        Notification::where('user_id', Auth::id())->delete();
        return response()->json(['message' => 'All notifications cleared']);
    }
}
