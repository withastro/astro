import {
	decodeBase64,
	decodeHex,
	encodeBase64,
	encodeHexLowerCase,
	encodeHexUpperCase,
} from '@oslojs/encoding';
import { ALGORITHMS, type CspAlgorithm, type CspHash } from './csp/sources.js';

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
 * Hash a CryptoKey into a one-way hex digest safe to persist. Server-island
 * ciphertext is bound to the key, so the incremental build cache uses this to
 * detect when the key changed between builds.
 */
export async function hashCryptoKey(key: CryptoKey): Promise<string> {
	const exported = await crypto.subtle.exportKey('raw', key);
	const digest = await crypto.subtle.digest('SHA-256', exported);
	return encodeHexLowerCase(new Uint8Array(digest));
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
 * Derives the IV from the key, additionalData and plaintext (a synthetic IV, as in AES-SIV).
 * The same inputs always give the same IV, and different inputs give different IVs with the
 * same collision odds as random ones, so AES-GCM never reuses an IV for a different message.
 * The HMAC key is derived from the AES key with HKDF so that the two keys stay independent.
 */
async function deriveSyntheticIv(key: CryptoKey, data: Uint8Array, additionalData: Uint8Array) {
	const rawKey = await crypto.subtle.exportKey('raw', key);
	const hkdfKey = await crypto.subtle.importKey('raw', rawKey, 'HKDF', false, ['deriveKey']);
	const hmacKey = await crypto.subtle.deriveKey(
		{
			name: 'HKDF',
			hash: 'SHA-256',
			salt: new Uint8Array(),
			info: encoder.encode('astro server island iv'),
		},
		hkdfKey,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	// Prefixing the additionalData length keeps different (additionalData, plaintext) splits of
	// the same bytes apart.
	const message = new Uint8Array(4 + additionalData.length + data.length);
	new DataView(message.buffer).setUint32(0, additionalData.length);
	message.set(additionalData, 4);
	message.set(data, 4 + additionalData.length);
	const mac = await crypto.subtle.sign('HMAC', hmacKey, message);
	return new Uint8Array(mac, 0, IV_LENGTH / 2);
}

/**
 * Using a CryptoKey, encrypt a string into a base64 string.
 * @param additionalData Optional authenticated context (e.g. "props:ComponentName") that is
 *   verified during decryption but not included in the ciphertext. Both sides must agree on
 *   the same value or decryption will fail.
 * @param options.deterministic When `true`, the same key, plaintext and additionalData always
 *   produce the same ciphertext. This reveals when two ciphertexts hold the same plaintext, so
 *   only use it where that is already public (e.g. prerendered pages). Defaults to a random IV.
 */
export async function encryptString(
	key: CryptoKey,
	raw: string,
	additionalData?: string,
	options?: { deterministic?: boolean },
) {
	const data = encoder.encode(raw);
	const iv = options?.deterministic
		? await deriveSyntheticIv(key, data, encoder.encode(additionalData ?? ''))
		: crypto.getRandomValues(new Uint8Array(IV_LENGTH / 2));
	const params: AesGcmParams = { name: ALGORITHM, iv };
	if (additionalData) {
		params.additionalData = encoder.encode(additionalData);
	}
	const buffer = await crypto.subtle.encrypt(params, key, data);
	// iv is 12, hex brings it to 24
	return encodeHexUpperCase(iv) + encodeBase64(new Uint8Array(buffer));
}

/**
 * Takes a base64 encoded string, decodes it and returns the decrypted text.
 * @param additionalData Must match the value used during encryption, or decryption will fail.
 */
export async function decryptString(key: CryptoKey, encoded: string, additionalData?: string) {
	const iv = decodeHex(encoded.slice(0, IV_LENGTH)) as Uint8Array<ArrayBuffer>;
	const dataArray = decodeBase64(encoded.slice(IV_LENGTH)) as Uint8Array<ArrayBuffer>;
	const params: AesGcmParams = { name: ALGORITHM, iv };
	if (additionalData) {
		params.additionalData = encoder.encode(additionalData);
	}
	const decryptedBuffer = await crypto.subtle.decrypt(params, key, dataArray);
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
