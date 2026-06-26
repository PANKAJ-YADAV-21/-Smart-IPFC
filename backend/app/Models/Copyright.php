<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Copyright extends Model
{
    protected $fillable = [
        'ip_application_id',
        'work_type',
        'description',
        'creation_date',
        'publication_date',
        'owner_name',
    ];

    public function ipApplication()
    {
        return $this->belongsTo(IpApplication::class);
    }
}
