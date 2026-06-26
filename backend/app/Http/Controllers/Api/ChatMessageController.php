<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatMessageController extends Controller
{
    /**
     * Display a listing of chat messages.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Staff and Admin see all support chat threads
        if ($user->role === 'admin' || $user->role === 'staff' || $user->role === 'expert') {
            $messages = ChatMessage::with(['sender', 'receiver'])
                ->oldest()
                ->get();
            return response()->json($messages);
        }

        // Clients see messages that they sent or received
        $messages = ChatMessage::where('sender_id', $user->id)
            ->orWhere('receiver_id', $user->id)
            ->with(['sender', 'receiver'])
            ->oldest()
            ->get();

        return response()->json($messages);
    }

    /**
     * Send a new message.
     */
    public function store(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'ip_application_id' => 'nullable|exists:ip_applications,id',
            'receiver_id' => 'nullable|exists:users,id',
        ]);

        $receiverId = $request->receiver_id;
        if (!$receiverId) {
            $staff = User::whereIn('role', ['admin', 'staff', 'expert'])->first();
            $receiverId = $staff ? $staff->id : 1;
        }

        $message = ChatMessage::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $receiverId,
            'ip_application_id' => $request->ip_application_id,
            'message' => $request->message,
            'is_read' => false,
        ]);

        // Send notifications when messages are posted
        $snippet = strlen($message->message) > 60 ? substr($message->message, 0, 60) . '...' : $message->message;

        if (Auth::user()->role === 'client') {
            // Client sent message -> notify all support staff/admins
            $staffUsers = User::whereIn('role', ['staff', 'admin', 'expert'])->get();
            foreach ($staffUsers as $su) {
                // Avoid notifying the sender
                if ($su->id !== Auth::id()) {
                    \App\Models\Notification::send(
                        $su->id,
                        "New Support Chat Message",
                        "Client \"" . Auth::user()->name . "\" sent a query: \"{$snippet}\"",
                        'info'
                    );
                }
            }
        } else {
            // Staff sent message -> notify the target client
            \App\Models\Notification::send(
                $message->receiver_id,
                "New Message from Support Team",
                "\"" . Auth::user()->name . "\" (Support) replied: \"{$snippet}\"",
                'info'
            );
        }

        return response()->json($message->load(['sender', 'receiver']), 201);
    }
}
