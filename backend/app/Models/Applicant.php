<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Applicant extends Model
{
    protected $fillable = [
        'ip_application_id',
        'full_name',
        'company_name',
        'applicant_type',
        'nationality',
        'address',
        'email',
        'phone_number',
    ];

    public function ipApplication()
    {
        return $this->belongsTo(IpApplication::class);
    }
}
