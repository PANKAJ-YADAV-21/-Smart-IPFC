<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

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
            'message' => 'required_without:file|nullable|string|max:2000',
            'file' => 'nullable|file|mimes:pdf,jpg,png,doc,docx|max:10240',
            'ip_application_id' => 'nullable|exists:ip_applications,id',
            'receiver_id' => 'nullable|exists:users,id',
        ]);

        $receiverId = $request->receiver_id;
        if (!$receiverId) {
            $staff = User::whereIn('role', ['admin', 'staff', 'expert'])->first();
            $receiverId = $staff ? $staff->id : 1;
        }

        $attachmentPath = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $attachmentPath = $file->store('chat_attachments/' . Auth::id(), 'local');
        }

        $message = ChatMessage::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $receiverId,
            'ip_application_id' => $request->ip_application_id,
            'message' => $request->message ?? ('Sent an attachment: ' . $file->getClientOriginalName()),
            'is_read' => false,
            'attachment_path' => $attachmentPath,
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

    /**
     * Get distinct chat threads with last message details and unread count.
     */
    public function threads()
    {
        $user = Auth::user();
        
        if ($user->role === 'client') {
            // Clients chat with staff/admins. Let's return the support team users
            $supportStaff = User::whereIn('role', ['admin', 'staff', 'expert'])->get();
            return response()->json($supportStaff);
        }

        // Staff/Admin/Expert: retrieve all distinct client IDs involved in chat
        $clientIds = ChatMessage::select('sender_id as client_id')
            ->where('sender_id', '!=', $user->id)
            ->union(
                ChatMessage::select('receiver_id as client_id')
                    ->where('receiver_id', '!=', $user->id)
            )
            ->get()
            ->pluck('client_id')
            ->toArray();

        $clients = User::whereIn('id', $clientIds)
            ->where('role', 'client')
            ->get();

        $threads = [];
        foreach ($clients as $client) {
            $lastMessage = ChatMessage::where(function($q) use ($client, $user) {
                    $q->where('sender_id', $client->id)->where('receiver_id', $user->id);
                })
                ->orWhere(function($q) use ($client, $user) {
                    $q->where('sender_id', $user->id)->where('receiver_id', $client->id);
                })
                ->with(['sender', 'receiver'])
                ->latest()
                ->first();

            $unreadCount = ChatMessage::where('sender_id', $client->id)
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->count();

            if ($lastMessage) {
                $threads[] = [
                    'client' => $client,
                    'last_message' => $lastMessage,
                    'unread_count' => $unreadCount,
                ];
            }
        }

        // Sort by last message time descending
        usort($threads, function($a, $b) {
            return strtotime($b['last_message']->created_at) - strtotime($a['last_message']->created_at);
        });

        return response()->json($threads);
    }

    /**
     * Mark all incoming messages for current user as read.
     */
    public function markAllAsRead()
    {
        $user = Auth::user();
        
        ChatMessage::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All incoming messages marked as read']);
    }

    /**
     * Securely download or display chat attachment.
     */
    public function downloadAttachment($id)
    {
        $message = ChatMessage::findOrFail($id);
        $user = Auth::user();

        // Security check: Only sender, receiver, or administrative staff can access the file
        $isParticipant = ($message->sender_id === $user->id || $message->receiver_id === $user->id);
        $isStaff = in_array($user->role, ['admin', 'staff', 'expert']);

        if (!$isParticipant && !$isStaff) {
            return response()->json(['message' => 'Unauthorized access to chat attachment'], 403);
        }

        if (!$message->attachment_path || !Storage::disk('local')->exists($message->attachment_path)) {
            return response()->json(['message' => 'Attachment file not found'], 404);
        }

        return Storage::disk('local')->response($message->attachment_path);
    }
}
