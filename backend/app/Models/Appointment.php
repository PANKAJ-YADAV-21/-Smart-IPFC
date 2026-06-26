<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'client_id',
        'expert_id',
        'appointment_date',
        'type',
        'status',
        'notes',
        'meeting_link',
        'rejection_reason',
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function expert()
    {
        return $this->belongsTo(User::class, 'expert_id');
    }
}
