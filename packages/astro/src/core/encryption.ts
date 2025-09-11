import { decodeBase64, decodeHex, encodeBase64, encodeHexUpperCase } from '@oslojs/encoding';
import type { CspAlgorithm } from '../types/public/index.js';
import { ALGORITHMS, type CspHash } from './csp/config.js';

// Chose this algorithm for no particular reason, can change.
// This algo does check against text manipulation though. See
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm
const ALGORITHM = 'AES-GCM';

/**
 * Creates a CryptoKey object that can be used to encrypt any string.
 */
export async function createKey() {
	const key = await crypto.subtle.generateKey(
		{
			name: ALGORITHM,
			length: 256,
		},
		true,
		['encrypt', 'decrypt'],
	);
	return key;
}

// The environment variable name that can be used to provide the encrypted key.
const ENVIRONMENT_KEY_NAME = 'ASTRO_KEY' as const;

/**
 * Get the encoded value of the ASTRO_KEY env var.
 */
function getEncodedEnvironmentKey(): string {
	return process.env[ENVIRONMENT_KEY_NAME] || '';
}

/**
 * See if the environment variable key ASTRO_KEY is set.
 */
export function hasEnvironmentKey(): boolean {
	return getEncodedEnvironmentKey() !== '';
}

/**
 * Get the environment variable key and decode it into a CryptoKey.
 */
export async function getEnvironmentKey(): Promise<CryptoKey> {
	// This should never happen, because we always check `hasEnvironmentKey` before this is called.
	if (!hasEnvironmentKey()) {
		throw new Error(
			`There is no environment key defined. If you see this error there is a bug in Astro.`,
		);
	}
	const encodedKey = getEncodedEnvironmentKey();
	return decodeKey(encodedKey);
}

/**
 * Encodes a CryptoKey to base64 string, so that it can be embedded in JSON / JavaScript
 */
export async function encodeKey(key: CryptoKey) {
	const exported = await crypto.subtle.exportKey('raw', key);
	const encodedKey = encodeBase64(new Uint8Array(exported));
	return encodedKey;
}

/**
 * Decodes a base64 string into bytes and then imports the key.
 */
export async function decodeKey(encoded: string): Promise<CryptoKey> {
	const bytes = decodeBase64(encoded);
	return crypto.subtle.importKey('raw', bytes.buffer as ArrayBuffer, ALGORITHM, true, [
		'encrypt',
		'decrypt',
	]);
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
// The length of the initialization vector
// See https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
const IV_LENGTH = 24;

/**
 * Using a CryptoKey, encrypt a string into a base64 string.
 */
export async function encryptString(key: CryptoKey, raw: string) {
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH / 2));
	const data = encoder.encode(raw);
	const buffer = await crypto.subtle.encrypt(
		{
			name: ALGORITHM,
			iv,
		},
		key,
		data,
	);
	// iv is 12, hex brings it to 24
	return encodeHexUpperCase(iv) + encodeBase64(new Uint8Array(buffer));
}

/**
 * Takes a base64 encoded string, decodes it and returns the decrypted text.
 */
export async function decryptString(key: CryptoKey, encoded: string) {
	const iv = decodeHex(encoded.slice(0, IV_LENGTH)) as Uint8Array<ArrayBuffer>;
	const dataArray = decodeBase64(encoded.slice(IV_LENGTH)) as Uint8Array<ArrayBuffer>;
	const decryptedBuffer = await crypto.subtle.decrypt(
		{
			name: ALGORITHM,
			iv,
		},
		key,
		dataArray,
	);
	const decryptedString = decoder.decode(decryptedBuffer);
	return decryptedString;
}

/**
 * Generates an SHA-256 digest of the given string.
 * @param {string} data The string to hash.
 * @param {CspAlgorithm} algorithm The algorithm to use.
 */
export async function generateCspDigest(data: string, algorithm: CspAlgorithm): Promise<CspHash> {
	const hashBuffer = await crypto.subtle.digest(algorithm, encoder.encode(data));

	const hash = encodeBase64(new Uint8Array(hashBuffer));
	return `${ALGORITHMS[algorithm]}${hash}`;
}

/**
 * Generate SHA-256 hash of buffer.
 * @param {ArrayBuffer} data The buffer data to hash
 * @returns {Promise<string>} A hex string of the first 16 characters of the SHA-256 hash
 */
export async function generateContentHash(data: ArrayBuffer): Promise<string> {
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = new Uint8Array(hashBuffer);
	return encodeBase64(hashArray);
}
