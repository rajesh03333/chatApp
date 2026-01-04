// ================== helpers ==================
export function base64ToBytes(base64) {
  if (!base64) throw new Error("base64ToBytes received undefined");

  // Remove PEM headers if present
  const cleaned = base64
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");

  return Uint8Array.from(atob(cleaned), c => c.charCodeAt(0));
}


export function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

// ================== key generation ==================
export async function generateKeys() {
  // Encryption key (ECDH)
  const ecdhKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  // Signing key (Ed25519)
  const signKeyPair = await crypto.subtle.generateKey(
    { name: "Ed25519" },
    true,
    ["sign", "verify"]
  );

  return { ecdhKeyPair, signKeyPair };
}

// ================== export keys ==================
export async function exportPrivateKey(key) {
  const raw = await crypto.subtle.exportKey("pkcs8", key);
  return bytesToBase64(new Uint8Array(raw));
}

export async function exportPublicKey(key) {
  const raw = await crypto.subtle.exportKey("spki", key);
  return bytesToBase64(new Uint8Array(raw));
}

// ================== shared secret ==================
export async function deriveSharedSecret(
  myPrivateECDHBase64,
  theirPublicECDHBase64
) {
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    base64ToBytes(myPrivateECDHBase64),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"]
  );

  const publicKey = await crypto.subtle.importKey(
    "spki",
    base64ToBytes(theirPublicECDHBase64),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ================== encryption ==================
export async function encryptMessage(text, aesKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(text)
  );

  return {
    cipher: bytesToBase64(new Uint8Array(cipher)),
    iv: bytesToBase64(iv)
  };
}

export async function decryptMessage(cipher, iv, aesKey) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    aesKey,
    base64ToBytes(cipher)
  );

  return new TextDecoder().decode(decrypted);
}

// ================== signing ==================
export async function signMessage(message, privateSignKeyBase64) {
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    base64ToBytes(privateSignKeyBase64),
    { name: "Ed25519" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    new TextEncoder().encode(message)
  );

  return bytesToBase64(new Uint8Array(sig));
}

export async function verifySignature(
  message,
  signatureBase64,
  publicSignKeyBase64
) {
  const publicKey = await crypto.subtle.importKey(
    "spki",
    base64ToBytes(publicSignKeyBase64),
    { name: "Ed25519" },
    false,
    ["verify"]
  );

  return crypto.subtle.verify(
    "Ed25519",
    publicKey,
    base64ToBytes(signatureBase64),
    new TextEncoder().encode(message)
  );
}
