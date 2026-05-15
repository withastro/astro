import type { CspAlgorithm } from '../types/public/index.js';
import { type CspHash } from './csp/config.js';
/**
 * Creates a CryptoKey object that can be used to encrypt any string.
 */
export declare function createKey(): Promise<CryptoKey>;
/**
 * See if the environment variable key ASTRO_KEY is set.
 */
export declare function hasEnvironmentKey(): boolean;
/**
 * Get the environment variable key and decode it into a CryptoKey.
 */
export declare function getEnvironmentKey(): Promise<CryptoKey>;
/**
 * Encodes a CryptoKey to base64 string, so that it can be embedded in JSON / JavaScript
 */
export declare function encodeKey(key: CryptoKey): Promise<string>;
/**
 * Decodes a base64 string into bytes and then imports the key.
 */
export declare function decodeKey(encoded: string): Promise<CryptoKey>;
/**
 * Using a CryptoKey, encrypt a string into a base64 string.
 * @param additionalData Optional authenticated context (e.g. "props:ComponentName") that is
 *   verified during decryption but not included in the ciphertext. Both sides must agree on
 *   the same value or decryption will fail.
 */
export declare function encryptString(
	key: CryptoKey,
	raw: string,
	additionalData?: string,
): Promise<string>;
/**
 * Takes a base64 encoded string, decodes it and returns the decrypted text.
 * @param additionalData Must match the value used during encryption, or decryption will fail.
 */
export declare function decryptString(
	key: CryptoKey,
	encoded: string,
	additionalData?: string,
): Promise<string>;
/**
 * Generates an SHA-256 digest of the given string.
 * @param {string} data The string to hash.
 * @param {CspAlgorithm} algorithm The algorithm to use.
 */
export declare function generateCspDigest(data: string, algorithm: CspAlgorithm): Promise<CspHash>;
/**
 * Generate SHA-256 hash of buffer.
 * @param {ArrayBuffer} data The buffer data to hash
 * @returns {Promise<string>} A hex string of the first 16 characters of the SHA-256 hash
 */
export declare function generateContentHash(data: ArrayBuffer): Promise<string>;
