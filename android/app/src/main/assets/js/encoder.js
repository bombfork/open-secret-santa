/**
 * URL encoding and decoding utilities for Secret Santa data
 * Uses Base64 encoding for compact representation
 */

/**
 * Simple hash function for password validation
 * Not cryptographically secure - for casual use only
 * @param {string} password - Password to hash
 * @returns {string} - Hashed password
 */
export function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Simple XOR cipher for basic obfuscation
 * Not cryptographically secure - for casual use only
 * @param {string} text - Text to encrypt/decrypt
 * @param {string} key - Encryption key (seed)
 * @returns {string} - Encrypted/decrypted text
 */
function xorCipher(text, key) {
  if (!key || key.length === 0) {
    return text; // No encryption if key is empty
  }

  let result = "";
  for (let i = 0; i < text.length; i++) {
    const textCode = text.charCodeAt(i);
    const keyCode = key.charCodeAt(i % key.length);
    result += String.fromCharCode(textCode ^ keyCode);
  }
  return result;
}

/**
 * Encrypt assignments using seed as key
 * @param {Object[]} assignments - Array of {giver, receiver} pairs
 * @param {string} seed - Encryption key
 * @returns {string} - Encrypted assignments as string
 */
function encryptAssignments(assignments, seed) {
  const jsonString = JSON.stringify(assignments);
  return xorCipher(jsonString, seed);
}

/**
 * Decrypt assignments using seed as key
 * @param {string} encryptedData - Encrypted assignments string
 * @param {string} seed - Decryption key
 * @returns {Object[]} - Decrypted assignments array
 */
function decryptAssignments(encryptedData, seed) {
  const jsonString = xorCipher(encryptedData, seed);
  return JSON.parse(jsonString);
}

/**
 * Encode Secret Santa data for URL
 * @param {Object[]} assignments - Array of {giver, receiver} pairs
 * @param {string} seed - Random seed used
 * @param {string} adminPassword - Admin password (will be hashed and stored in data)
 * @returns {Object} - Encoded data object with data only (passwordHash now included in data)
 */
export function encodeData(assignments, seed, adminPassword) {
  // Encrypt assignments using seed as key (basic obfuscation)
  const encryptedAssignments = encryptAssignments(assignments, seed);

  const data = {
    seed: seed,
    assignments: encryptedAssignments,
    passwordHash: hashPassword(adminPassword),
  };

  const jsonString = JSON.stringify(data);
  const base64 = btoa(unescape(encodeURIComponent(jsonString)));

  return {
    data: base64,
  };
}

/**
 * Decode Secret Santa data from URL parameter
 * @param {string} encodedData - Base64 encoded data
 * @returns {Object} - Decoded data object with seed and decrypted assignments
 */
export function decodeData(encodedData) {
  try {
    const jsonString = decodeURIComponent(escape(atob(encodedData)));
    const data = JSON.parse(jsonString);

    // Decrypt assignments using seed as key
    data.assignments = decryptAssignments(data.assignments, data.seed);

    return data;
  } catch {
    throw new Error("Invalid data format");
  }
}

/**
 * Generate admin URL
 * @param {string} baseUrl - Base URL of the application
 * @param {string} encodedData - Encoded data string (includes password hash)
 * @returns {string} - Complete admin URL
 */
export function generateAdminUrl(baseUrl, encodedData) {
  const url = new URL(baseUrl);
  url.searchParams.set("data", encodedData);
  url.searchParams.set("admin", "true");
  return url.toString();
}

/**
 * Generate participant URL
 * @param {string} baseUrl - Base URL of the application
 * @param {string} encodedData - Encoded data string
 * @param {string} participantName - Name of the participant
 * @returns {string} - Complete participant URL
 */
export function generateParticipantUrl(baseUrl, encodedData, participantName) {
  const url = new URL(baseUrl);
  url.searchParams.set("data", encodedData);
  url.searchParams.set("user", encodeURIComponent(participantName));
  return url.toString();
}

/**
 * Parse URL parameters
 * @returns {Object} - Object with data, admin, and user parameters
 */
export function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    data: params.get("data"),
    admin: params.get("admin"),
    user: params.get("user") ? decodeURIComponent(params.get("user")) : null,
  };
}

/**
 * Verify admin password
 * @param {string} password - Password to verify
 * @param {string} storedHash - Stored password hash
 * @returns {boolean} - True if password matches
 */
export function verifyPassword(password, storedHash) {
  return hashPassword(password) === storedHash;
}
