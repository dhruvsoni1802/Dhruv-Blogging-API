// Uploads media files to the Supabase Storage "blog-media" bucket.
import supabase from './supabase.js';

const BUCKET = 'blog-media';

export async function uploadMedia(file) {
  const ext = file.originalname.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return {
    path: data.path,
    url: publicUrl.publicUrl,
    mimeType: file.mimetype,
    originalName: file.originalname,
  };
}

export async function deleteMedia(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
