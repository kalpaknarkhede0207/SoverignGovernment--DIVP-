/**
 * envelopeEncryption.js - AES-256-GCM Two-Tier Envelope Encryption
 * Part of SG-DIVP (Sovereign Government Document Intelligence & Verification Platform)
 * 
 * Implements NIST SP 800-57 Part 1 Rev. 5 & NIST SP 800-38D compliant envelope encryption.
 * Upgraded with NIST SP 800-132 PBKDF2 Key Derivation (100,000 rounds) and Additional
 * Authenticated Data (AAD) cryptographic binding to prevent ciphertext transplantation (SEC-HIGH-02, SEC-MED-02).
 */

const crypto = require('crypto');

const MASTER_KEK_SALT = 'MAHAGOV_SG_DIVP_SOVEREIGN_SALT_2026_NIST_SP800_132';

/**
 * Derives a 256-bit Key Encryption Key using PBKDF2 with 100,000 iterations
 */
function deriveKek(passphrase, salt = MASTER_KEK_SALT, iterations = 100000) {
  return crypto.pbkdf2Sync(passphrase, salt, iterations, 32, 'sha256');
}

// Master Key Store (Derived via PBKDF2 with Production Hardening - AUD-HIGH-02)
const IS_PROD_KEK = (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') && !process.env.TEST_MODE;
const fallbackKek1 = IS_PROD_KEK ? crypto.randomBytes(32).toString('hex') : 'SOVEREIGN_GOV_MASTER_KEK_V1_AIRGAP_SECRET_2026';
const fallbackKek2 = IS_PROD_KEK ? crypto.randomBytes(32).toString('hex') : 'SOVEREIGN_GOV_MASTER_KEK_V2_AIRGAP_SECRET_2027';

const MASTER_KEK_STORE = {
  v1: deriveKek(process.env.SOVEREIGN_MASTER_KEK_V1 || fallbackKek1),
  v2: deriveKek(process.env.SOVEREIGN_MASTER_KEK_V2 || fallbackKek2)
};

let activeKekVersion = 'v1';

/**
 * Returns current active master key version
 */
function getActiveKekVersion() {
  return activeKekVersion;
}

/**
 * Rotates master key to a new version using standard PBKDF2 derivation
 */
function rotateMasterKey(version, secretOrBuffer) {
  if (!version) throw new Error('Key version required');
  const keyBuffer = Buffer.isBuffer(secretOrBuffer)
    ? secretOrBuffer
    : deriveKek(String(secretOrBuffer));

  MASTER_KEK_STORE[version] = keyBuffer;
  activeKekVersion = version;
  return activeKekVersion;
}

/**
 * Encrypts an ephemeral DEK using the specified KEK version
 */
function wrapDEK(dekBuffer, kekVersion) {
  const kek = MASTER_KEK_STORE[kekVersion];
  if (!kek) throw new Error(`KEK version ${kekVersion} not found in secure key store`);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
  const encryptedDEK = Buffer.concat([cipher.update(dekBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    wrappedKey: encryptedDEK.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    kekVersion
  };
}

/**
 * Decrypts a wrapped DEK using the corresponding KEK version
 */
function unwrapDEK(wrappedObject) {
  const kek = MASTER_KEK_STORE[wrappedObject.kekVersion];
  if (!kek) throw new Error(`KEK version ${wrappedObject.kekVersion} not recognized`);

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    kek,
    Buffer.from(wrappedObject.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(wrappedObject.authTag, 'hex'));

  const dek = Buffer.concat([
    decipher.update(Buffer.from(wrappedObject.wrappedKey, 'hex')),
    decipher.final()
  ]);

  return dek;
}

/**
 * Encrypts arbitrary plaintext (string or Buffer) using envelope encryption
 * with optional Additional Authenticated Data (AAD) binding (SEC-MED-02).
 */
function encryptPayload(plaintext, targetKekVersion = activeKekVersion, aad = null) {
  const dataBuffer = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(String(plaintext), 'utf8');

  // 1. Generate ephemeral 256-bit DEK
  const ephemeralDEK = crypto.randomBytes(32);

  // 2. Encrypt plaintext payload with ephemeral DEK using AES-256-GCM
  const payloadIV = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ephemeralDEK, payloadIV);

  if (aad) {
    const aadBuf = Buffer.isBuffer(aad) ? aad : Buffer.from(String(aad), 'utf8');
    cipher.setAAD(aadBuf);
  }

  const ciphertext = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
  const payloadAuthTag = cipher.getAuthTag();

  // 3. Wrap ephemeral DEK with versioned Master KEK
  const wrappedDEK = wrapDEK(ephemeralDEK, targetKekVersion);

  return {
    algorithm: 'AES-256-GCM-ENVELOPE',
    payloadIV: payloadIV.toString('hex'),
    payloadAuthTag: payloadAuthTag.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
    wrappedDEK,
    hasAad: !!aad
  };
}

/**
 * Decrypts an envelope-encrypted payload with optional AAD verification (SEC-MED-02)
 */
function decryptPayload(envelope, expectedAad = null) {
  if (!envelope || !envelope.wrappedDEK || !envelope.ciphertext) {
    throw new Error('Invalid envelope structure');
  }

  // 1. Unwrap ephemeral DEK using master KEK
  const ephemeralDEK = unwrapDEK(envelope.wrappedDEK);

  // 2. Decrypt ciphertext payload using ephemeral DEK
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    ephemeralDEK,
    Buffer.from(envelope.payloadIV, 'hex')
  );
  decipher.setAuthTag(Buffer.from(envelope.payloadAuthTag, 'hex'));

  if (expectedAad) {
    const aadBuf = Buffer.isBuffer(expectedAad) ? expectedAad : Buffer.from(String(expectedAad), 'utf8');
    decipher.setAAD(aadBuf);
  }

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'hex')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

/**
 * Re-wraps only the DEK to a newer KEK version without touching the ciphertext
 */
function rewrapDEKToNewKek(envelope, newKekVersion) {
  const ephemeralDEK = unwrapDEK(envelope.wrappedDEK);
  envelope.wrappedDEK = wrapDEK(ephemeralDEK, newKekVersion);
  return envelope;
}

module.exports = {
  deriveKek,
  encryptPayload,
  decryptPayload,
  rotateMasterKey,
  getActiveKekVersion,
  rewrapDEKToNewKek,
  MASTER_KEK_STORE
};
