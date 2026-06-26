<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndustrialDesign extends Model
{
    protected $fillable = [
        'ip_application_id',
        'product_category',
        'industry_sector',
        'design_category',
        'description',
        'shape_details',
        'pattern_details',
        'ornamentation_details',
        'material_details',
    ];

    public function ipApplication()
    {
        return $this->belongsTo(IpApplication::class);
    }
}
