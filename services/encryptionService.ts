// New marker for Web Crypto API based files
const ENCRYPTION_MARKER = 'ENCEPTION_CRYPTO_V1::';

// --- Helper Functions ---

// ArrayBuffer to Base64
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Base64 to ArrayBuffer
// FIX: Changed return type to Uint8Array and implementation to return the Uint8Array directly.
// This resolves a type mismatch when calling `deriveEncryptionKey`.
const base64ToBuffer = (base64: string): Uint8Array => {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
};

// Get a CryptoKey from a password string, to be used for derivation.
const getKeyMaterial = (password: string): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
}

// Derive an AES-GCM encryption key from a master key and a salt.
const deriveEncryptionKey = (passwordKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> => {
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000, // A standard number of iterations
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// --- Core Service Functions ---

export const encryptFile = async (file: File, password: string): Promise<string> => {
  if (!password) {
      throw new Error('A password is required for encryption.');
  }
  const passwordKey = await getKeyMaterial(password);
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits is recommended for GCM
  
  const derivedKey = await deriveEncryptionKey(passwordKey, salt);
  
  const fileContentBuffer = await file.arrayBuffer();
  
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    derivedKey,
    fileContentBuffer
  );

  const dataToPackage = {
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    content: bufferToBase64(encryptedContent),
  };
  
  const jsonString = JSON.stringify(dataToPackage);
  
  return ENCRYPTION_MARKER + jsonString;
};

export const decryptFile = async (file: File, password: string): Promise<{ url: string; fileName: string }> => {
  if (!password) {
    throw new Error('Decryption password is missing.');
  }

  const textContent = await file.text();
  
  if (!textContent.startsWith(ENCRYPTION_MARKER)) {
    throw new Error('Invalid or corrupted encrypted file. The file may not have been encrypted by this application.');
  }
  
  const jsonString = textContent.substring(ENCRYPTION_MARKER.length);
  
  let encryptedData: { originalName: string; mimeType: string; salt: string; iv: string; content: string };
  try {
      encryptedData = JSON.parse(jsonString);
  } catch(e) {
      throw new Error('Failed to parse file structure. The file may be corrupted.');
  }

  try {
    const passwordKey = await getKeyMaterial(password);
    const salt = base64ToBuffer(encryptedData.salt);
    const iv = base64ToBuffer(encryptedData.iv);
    const content = base64ToBuffer(encryptedData.content);

    const derivedKey = await deriveEncryptionKey(passwordKey, salt);

    const decryptedContent = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        derivedKey,
        content
    );

    const blob = new Blob([decryptedContent], { type: encryptedData.mimeType });
    const url = URL.createObjectURL(blob);
    
    return {
      url: url,
      fileName: encryptedData.originalName,
    };
  } catch (e) {
    console.error(e);
    throw new Error('Decryption failed. The password is likely incorrect or the file has been tampered with.');
  }
};