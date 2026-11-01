/**
 * totpAuth.js - RFC 6238 Multi-Factor Authentication Engine
 * Part of SG-DIVP (Sovereign Government Document Intelligence & Verification Platform)
 * 
 * Implements pure RFC 6238 HMAC-SHA1 Time-Based One-Time Passwords without external npm dependencies.
 * Enables zero-connectivity hardware tokens and standard authenticator apps (Google Authenticator,
 * YubiKey) to function with 100% security on an isolated air-gapped intranet.
 */

const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a Base32 string into a Buffer
 */
function base32Decode(base32Str) {
  const cleaned = base32Str.replace(/=+$/, '').toUpperCase().replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const output = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned.charAt(i);
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Illegal character in Base32 string: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

/**
 * Encodes a Buffer into a Base32 string
 */
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Generates a random Base32 secret for user enrollment
 */
function generateSecret(numBytes = 20) {
  const randomBuf = crypto.randomBytes(numBytes);
  return base32Encode(randomBuf);
}

/**
 * Generates a 6-digit TOTP code for a secret and time
 */
function generateTOTP(secret, timestampMs = Date.now(), timeStepSec = 30) {
  const key = base32Decode(secret);
  const counter = Math.floor(timestampMs / 1000 / timeStepSec);

  // Convert counter to 8-byte big-endian buffer
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  // Compute HMAC-SHA1
  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();

  // Dynamic Truncation (RFC 4226 Section 5.3)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return String(otp).padStart(6, '0');
}

// RFC 6238 Section 5.2 Replay Cache: Prevents replaying tokens within the valid drift window
const spentTokensCache = new Map(); // key `${secret}:${token}` -> expiry timestamp ms

function cleanExpiredSpentTokens(now = Date.now()) {
  for (const [key, expiresAt] of spentTokensCache.entries()) {
    if (expiresAt <= now) {
      spentTokensCache.delete(key);
    }
  }
}

/**
 * Verifies a 6-digit TOTP code within a drift window (default +/- 1 step = 30s)
 */
function verifyTOTP(token, secret, driftWindow = 1, timestampMs = Date.now(), timeStepSec = 30) {
  if (!token || typeof token !== 'string') return false;
  const normalizedToken = token.trim();
  if (normalizedToken.length !== 6 || !/^\d{6}$/.test(normalizedToken)) {
    return false;
  }

  for (let i = -driftWindow; i <= driftWindow; i++) {
    const testTime = timestampMs + i * timeStepSec * 1000;
    const expected = generateTOTP(secret, testTime, timeStepSec);
    if (crypto.timingSafeEqual(Buffer.from(normalizedToken), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

/**
 * Verifies and immediately consumes a TOTP code to prevent replay attacks (RFC 6238 Sec 5.2)
 */
function verifyAndConsumeTOTP(token, secret, driftWindow = 1, timestampMs = Date.now(), timeStepSec = 30) {
  cleanExpiredSpentTokens(timestampMs);
  const cacheKey = `${secret}:${token}`;
  if (spentTokensCache.has(cacheKey) && spentTokensCache.get(cacheKey) > timestampMs) {
    return false; // Token has already been spent
  }

  const isValid = verifyTOTP(token, secret, driftWindow, timestampMs, timeStepSec);
  if (isValid) {
    const maxExpiry = timestampMs + (driftWindow + 1) * timeStepSec * 1000;
    spentTokensCache.set(cacheKey, maxExpiry);
  }
  return isValid;
}

module.exports = {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  verifyAndConsumeTOTP,
  base32Encode,
  base32Decode
};
