import { decodeBase64, decodeHex, encodeBase64, encodeHexUpperCase } from '@oslojs/encoding';
import { ALGORITHMS } from './csp/config.js';
const ALGORITHM = 'AES-GCM';
async function createKey() {
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
const ENVIRONMENT_KEY_NAME = 'ASTRO_KEY';
function getEncodedEnvironmentKey() {
	return process.env[ENVIRONMENT_KEY_NAME] || '';
}
function hasEnvironmentKey() {
	return getEncodedEnvironmentKey() !== '';
}
async function getEnvironmentKey() {
	if (!hasEnvironmentKey()) {
		throw new Error(
			`There is no environment key defined. If you see this error there is a bug in Astro.`,
		);
	}
	const encodedKey = getEncodedEnvironmentKey();
	return decodeKey(encodedKey);
}
async function encodeKey(key) {
	const exported = await crypto.subtle.exportKey('raw', key);
	const encodedKey = encodeBase64(new Uint8Array(exported));
	return encodedKey;
}
async function decodeKey(encoded) {
	const bytes = decodeBase64(encoded);
	return crypto.subtle.importKey('raw', bytes.buffer, ALGORITHM, true, ['encrypt', 'decrypt']);
}
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const IV_LENGTH = 24;
async function encryptString(key, raw, additionalData) {
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH / 2));
	const data = encoder.encode(raw);
	const params = { name: ALGORITHM, iv };
	if (additionalData) {
		params.additionalData = encoder.encode(additionalData);
	}
	const buffer = await crypto.subtle.encrypt(params, key, data);
	return encodeHexUpperCase(iv) + encodeBase64(new Uint8Array(buffer));
}
async function decryptString(key, encoded, additionalData) {
	const iv = decodeHex(encoded.slice(0, IV_LENGTH));
	const dataArray = decodeBase64(encoded.slice(IV_LENGTH));
	const params = { name: ALGORITHM, iv };
	if (additionalData) {
		params.additionalData = encoder.encode(additionalData);
	}
	const decryptedBuffer = await crypto.subtle.decrypt(params, key, dataArray);
	const decryptedString = decoder.decode(decryptedBuffer);
	return decryptedString;
}
async function generateCspDigest(data, algorithm) {
	const hashBuffer = await crypto.subtle.digest(algorithm, encoder.encode(data));
	const hash = encodeBase64(new Uint8Array(hashBuffer));
	return `${ALGORITHMS[algorithm]}${hash}`;
}
async function generateContentHash(data) {
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = new Uint8Array(hashBuffer);
	return encodeBase64(hashArray);
}
export {
	createKey,
	decodeKey,
	decryptString,
	encodeKey,
	encryptString,
	generateContentHash,
	generateCspDigest,
	getEnvironmentKey,
	hasEnvironmentKey,
};
