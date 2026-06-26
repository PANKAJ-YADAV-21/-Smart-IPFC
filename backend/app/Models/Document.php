<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'user_id',
        'ip_application_id',
        'file_name',
        'file_path',
        'file_type',
        'category',
        'file_size',
        'version',
    ];

    /**
     * The user who uploaded this document.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The IP application this document belongs to.
     */
    public function ipApplication()
    {
        return $this->belongsTo(IpApplication::class);
    }
}
