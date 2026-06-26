<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trademark extends Model
{
    protected $fillable = [
        'ip_application_id',
        'trademark_type',
        'industry_category',
        'goods_category',
        'brand_description',
        'trademark_meaning',
        'usage_purpose',
        'first_use_date',
    ];

    public function ipApplication()
    {
        return $this->belongsTo(IpApplication::class);
    }
}
