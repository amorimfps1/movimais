// src/lib/storage.ts

/**
 * Supabase client instance.
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a document file to the Supabase "documents" storage bucket.
 *
 * @param file - The {@link File} to upload.
 * @param path - The destination path within the bucket (e.g., "consents/abc.pdf").
 * @returns The public URL of the uploaded file.
 * @throws If the upload fails.
 */
export async function uploadDocument(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').upload(path, file);
  if (error) {
    throw error;
  }
  const { data: publicData } = supabase.storage.from('documents').getPublicUrl(path);
  return publicData.publicUrl;
}

/**
 * Delete a document from the Supabase "documents" bucket.
 *
 * @param path - The path of the file to delete within the bucket.
 * @throws If the deletion fails.
 */
export async function deleteDocument(path: string): Promise<void> {
  const { error } = await supabase.storage.from('documents').remove([path]);
  if (error) {
    throw error;
  }
}

