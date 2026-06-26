<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log specific methods or everything (configurable). Let's log POST, PUT, DELETE, PATCH.
        if (in_array($request->method(), ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            try {
                $module = explode('/', $request->path())[1] ?? 'general'; // e.g., 'api/applications' -> 'applications'
                
                // Redact passwords from payload
                $payload = $request->except(['password', 'password_confirmation', 'old_password']);

                AuditLog::create([
                    'user_id' => Auth::id(),
                    'action' => $request->method(),
                    'module' => $module,
                    'description' => "User performed {$request->method()} on {$request->path()}",
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'payload' => $payload
                ]);
            } catch (\Exception $e) {
                // Fail silently so it doesn't break the application if logging fails
            }
        }

        return $response;
    }
}
