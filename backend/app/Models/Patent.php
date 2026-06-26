<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patent extends Model
{
    protected $fillable = [
        'ip_application_id',
        'patent_type',
        'technical_category',
        'filing_type',
        'technical_domain',
        'abstract',
        'background',
        'problem_statement',
        'limitations',
        'detailed_description',
        'novelty',
        'advantages',
        'applicability',
        'independent_claims',
        'dependent_claims',
    ];

    public function ipApplication()
    {
        return $this->belongsTo(IpApplication::class);
    }
}
