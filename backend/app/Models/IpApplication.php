<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IpApplication extends Model
{
    protected $fillable = [
        'user_id',
        'application_number',
        'registration_id',
        'expiry_date',
        'granted_at',
        'type',
        'status',
        'title',
        'description',
        'abstract',
        'claims',
        'inventor_details',
        'category',
        'brand_name',
        'work_type',
        'payment_amount',
        'payment_status',
        'field_feedbacks',
        'submitted_at'
    ];

    protected $casts = [
        'inventor_details' => 'array',
        'field_feedbacks' => 'array',
        'submitted_at' => 'datetime',
        'expiry_date' => 'date',
        'granted_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function workflowHistory()
    {
        return $this->hasMany(WorkflowHistory::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function applicant()
    {
        return $this->hasOne(Applicant::class);
    }

    public function patent()
    {
        return $this->hasOne(Patent::class);
    }

    public function trademark()
    {
        return $this->hasOne(Trademark::class);
    }

    public function copyright()
    {
        return $this->hasOne(Copyright::class);
    }

    public function industrialDesign()
    {
        return $this->hasOne(IndustrialDesign::class);
    }
}
