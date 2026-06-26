<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowHistory extends Model
{
    protected $fillable = [
        'ip_application_id',
        'user_id',
        'from_status',
        'to_status',
        'remarks',
    ];

    public function ipApplication()
    {
        return $this->belongsTo(IpApplication::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
