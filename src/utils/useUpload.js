import * as React from 'react';
import { UploadClient } from '@uploadcare/upload-client'
const client = new UploadClient({ publicKey: process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY });

/**
 * Upload hook - currently not used in the app.
 * 
 * TODO: If file uploads are needed, implement with:
 * - Supabase Storage (recommended)
 * - Or another storage backend
 * 
 * The previous CreateAnything API endpoints have been removed.
 */
function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      
      // Uploadcare fallback for reactNativeAsset without file property
      if ("reactNativeAsset" in input && input.reactNativeAsset) {
        let asset = input.reactNativeAsset;
        
        if (!asset.file) {
          // Direct Uploadcare upload (no presign endpoint available)
          const result = await client.uploadFile(asset, {
            fileName: asset.name ?? asset.uri.split("/").pop(),
            contentType: asset.mimeType,
          });
          return { url: result.cdnUrl || result.uuid, mimeType: result.mimeType || null };
        }
      }
      
      // All other upload types need backend implementation
      throw new Error("File upload not implemented. Please configure Supabase Storage or another backend.");
    } catch (uploadError) {
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export { useUpload };
export default useUpload;