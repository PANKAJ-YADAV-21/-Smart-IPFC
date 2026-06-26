<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    /**
     * Display a listing of documents for an application.
     */
    public function index(Request $request)
    {
        $request->validate(['ip_application_id' => 'required|exists:ip_applications,id']);
        
        $documents = Document::where('ip_application_id', $request->ip_application_id)
            ->latest()
            ->get();

        return response()->json($documents);
    }

    /**
     * Store a newly uploaded document.
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,png,doc,docx|max:10240',
            'ip_application_id' => 'nullable|exists:ip_applications,id',
            'category' => 'required|string',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('documents/' . Auth::id(), 'local');

            $document = Document::create([
                'user_id' => Auth::id(),
                'ip_application_id' => $request->ip_application_id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension(),
                'category' => $request->category,
                'file_size' => $file->getSize(),
            ]);

            return response()->json($document, 201);
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }

    /**
     * Download a document.
     */
    public function download(string $id)
    {
        $document = Document::findOrFail($id);

        // RBAC check
        if (Auth::user()->role === 'client' && $document->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $document = Document::findOrFail($id);

        if (Auth::user()->role === 'client' && $document->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Document deleted']);
    }
}
