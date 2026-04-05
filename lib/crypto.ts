/**
 * E2E Encryption using Web Crypto API (AES-GCM)
 * Simplified: uses a deterministic shared key derived from sorted user IDs
 */

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;

// Derive a deterministic key from two user IDs
const deriveKey = async (userId1: string, userId2: string): Promise<CryptoKey> => {
  const sorted = [userId1, userId2].sort().join('::');
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sorted),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('spacebox-e2e-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptMessage = async (
  plaintext: string,
  senderId: string,
  receiverId: string
): Promise<string> => {
  try {
    const key = await deriveKey(senderId, receiverId);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: ALGO, iv },
      key,
      encoder.encode(plaintext)
    );

    // Combine IV + ciphertext and base64 encode
    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed, sending plain:', error);
    return plaintext;
  }
};

export const decryptMessage = async (
  ciphertext: string,
  senderId: string,
  receiverId: string
): Promise<string> => {
  try {
    const key = await deriveKey(senderId, receiverId);
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // If decryption fails, return as-is (might be plain text)
    return ciphertext;
  }
};
