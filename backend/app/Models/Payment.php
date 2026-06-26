<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'ip_application_id',
        'amount',
        'currency',
        'transaction_id',
        'payment_method',
        'status',
        'payment_details',
    ];

    protected $casts = [
        'payment_details' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ipApplication()
    {
        return $this->belongsTo(IpApplication::class);
    }
}
