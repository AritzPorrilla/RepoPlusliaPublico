<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['community_id', 'uploaded_by', 'title', 'description', 'file_path', 'file_name', 'file_size', 'mime_type'])]
class CommunityDocument extends Model
{
    public function community(): BelongsTo
    {
        return $this->belongsTo(EnergyCommunity::class, 'community_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }
}
