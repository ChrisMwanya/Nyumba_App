import type { UploadSignature } from '@/services/authService';

type UploadResult = { url: string; publicId: string };

/**
 * Téléverse un fichier local directement sur Cloudinary.
 *
 * L'image ne transite pas par l'API Nyumba : celle-ci se contente de signer la
 * requête, ce qui lui évite d'absorber la bande passante des photos. Le secret
 * Cloudinary reste côté serveur.
 */
export async function uploadToCloudinary(
  uri: string,
  signature: UploadSignature
): Promise<UploadResult> {
  const form = new FormData();
  // React Native accepte cet objet à la place d'un Blob.
  form.append('file', {
    uri,
    // Cloudinary se fie surtout à l'extension : le type sert de repli.
    type: 'image/jpeg',
    name: uri.split('/').pop() ?? 'photo.jpg',
  } as unknown as Blob);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    { method: 'POST', body: form }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message ?? "L'envoi de l'image a échoué.");
  }

  return {
    url: payload.secure_url as string,
    publicId: payload.public_id as string,
  };
}
