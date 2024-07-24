import { base64, decodeHex, encodeHex } from '@oslojs/encoding';

const ALGORITHM = 'AES-GCM';

export async function createKey() {
	const key = await crypto.subtle.generateKey(
		{
			name: ALGORITHM,
			length: 256,
		},
		true,
		['encrypt', 'decrypt']
	);
	return key;
}

export async function importKey(bytes: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', bytes, ALGORITHM, true, ['encrypt', 'decrypt']);
  return key;
}

export async function encodeKey(key: CryptoKey) {
	const exported = await crypto.subtle.exportKey('raw', key);
	const encodedKey = base64.encode(new Uint8Array(exported));
	return encodedKey;
}

export async function decodeKey(encoded: string) {
  const bytes = base64.decode(encoded);
	return crypto.subtle.importKey('raw', bytes, ALGORITHM, true, ['encrypt', 'decrypt']);
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const IV_LENGTH = 24;

export async function encryptData(key: CryptoKey, raw: string) {
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH / 2));
	const data = encoder.encode(raw);
	const buffer = await crypto.subtle.encrypt(
		{
			name: ALGORITHM,
			iv,
		},
		key,
		data
	);
	// iv is 12, hex brings it to 24
	return encodeHex(iv) + base64.encode(new Uint8Array(buffer));
}

export async function decryptData(key: CryptoKey, encoded: string) {
  const iv = decodeHex(encoded.slice(0, IV_LENGTH));
	const dataArray = base64.decode(encoded.slice(IV_LENGTH));
	const decryptedBuffer = await crypto.subtle.decrypt(
		{
			name: ALGORITHM,
			iv,
		},
		key,
		dataArray
	);
	const decryptedString = decoder.decode(decryptedBuffer);
	return decryptedString;
}
