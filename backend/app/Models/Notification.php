<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'type',
        'is_read',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Static helper to dispatch a notification to a user.
     */
    public static function send($userId, $title, $description, $type = 'info')
    {
        return self::create([
            'user_id' => $userId,
            'title' => $title,
            'description' => $description,
            'type' => $type,
        ]);
    }
}
