import { getSupabaseAdminClient } from './supabase-admin';

/**
 * Upload a base64 image to Supabase Storage
 * @param base64Data - Base64 string with data URI prefix (data:image/jpeg;base64,...)
 * @param bucket - Supabase storage bucket name
 * @param folder - Optional folder path within the bucket
 * @returns Public URL of the uploaded image
 */
export async function uploadBase64ToSupabase(
  base64Data: string,
  bucket: string = 'Devotion-Photos',
  folder: string = 'c2s'
): Promise<string> {
  try {
    const supabase = getSupabaseAdminClient();

    // Extract the base64 content and mime type
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }

    const mimeType = matches[1];
    const base64Content = matches[2];
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = mimeType.split('/')[1] || 'jpg';
    const filename = `${timestamp}-${random}.${extension}`;
    const filePath = folder ? `${folder}/${filename}` : filename;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage using its URL
 * @param url - Public URL of the file to delete
 * @param bucket - Supabase storage bucket name
 */
export async function deleteFromSupabase(
  url: string,
  bucket: string = 'Devotion-Photos'
): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();

    // Extract the file path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/');

    if (!filePath) {
      throw new Error('Invalid file URL');
    }

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
}
