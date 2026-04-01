import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	createKey,
	decodeKey,
	decryptString,
	encodeKey,
	encryptString,
	generateCspDigest,
} from '../../../dist/core/encryption.js';

describe('encryption', () => {
	// #region encryptString / decryptString
	describe('encryptString / decryptString', () => {
		it('round-trips correctly', async () => {
			const key = await createKey();
			const original = 'hello world';
			const encrypted = await encryptString(key, original);
			const decrypted = await decryptString(key, encrypted);
			assert.equal(decrypted, original);
		});

		it('round-trips an empty string', async () => {
			const key = await createKey();
			const encrypted = await encryptString(key, '');
			const decrypted = await decryptString(key, encrypted);
			assert.equal(decrypted, '');
		});

		it('round-trips a JSON payload', async () => {
			const key = await createKey();
			const original = JSON.stringify({ foo: 'bar', num: 42, nested: { a: [1, 2] } });
			const encrypted = await encryptString(key, original);
			const decrypted = await decryptString(key, encrypted);
			assert.equal(decrypted, original);
		});

		it('produces a different ciphertext on each call (IV randomness)', async () => {
			const key = await createKey();
			const plain = 'same input';
			const first = await encryptString(key, plain);
			const second = await encryptString(key, plain);
			// Same plaintext — different ciphertext because each call uses a fresh IV
			assert.notEqual(first, second);
		});

		it('both distinct ciphertexts decrypt to the same plaintext', async () => {
			const key = await createKey();
			const plain = 'same input';
			const first = await encryptString(key, plain);
			const second = await encryptString(key, plain);
			assert.equal(await decryptString(key, first), plain);
			assert.equal(await decryptString(key, second), plain);
		});

		it('throws when decrypting a tampered ciphertext', async () => {
			const key = await createKey();
			const encrypted = await encryptString(key, 'secret');
			// Flip the last character to corrupt the ciphertext
			const tampered = encrypted.slice(0, -1) + (encrypted.endsWith('A') ? 'B' : 'A');
			await assert.rejects(() => decryptString(key, tampered));
		});

		it('throws when decrypting with the wrong key', async () => {
			const keyA = await createKey();
			const keyB = await createKey();
			const encrypted = await encryptString(keyA, 'secret');
			await assert.rejects(() => decryptString(keyB, encrypted));
		});
	});
	// #endregion

	// #region encodeKey / decodeKey
	describe('encodeKey / decodeKey', () => {
		it('round-trips a CryptoKey through base64', async () => {
			const key = await createKey();
			const encoded = await encodeKey(key);
			const decoded = await decodeKey(encoded);
			// Verify the decoded key works for encrypt/decrypt
			const plain = 'verify key works';
			const encrypted = await encryptString(decoded, plain);
			const decrypted = await decryptString(decoded, encrypted);
			assert.equal(decrypted, plain);
		});

		it('produces a string from encodeKey', async () => {
			const key = await createKey();
			const encoded = await encodeKey(key);
			assert.equal(typeof encoded, 'string');
			assert.ok(encoded.length > 0);
		});

		it('a key encoded then decoded can decrypt ciphertexts made with the original key', async () => {
			const key = await createKey();
			const plain = 'cross-key decrypt';
			const encrypted = await encryptString(key, plain);
			const encoded = await encodeKey(key);
			const decoded = await decodeKey(encoded);
			const decrypted = await decryptString(decoded, encrypted);
			assert.equal(decrypted, plain);
		});
	});
	// #endregion

	// #region generateCspDigest
	describe('generateCspDigest', () => {
		it('produces a sha256- prefixed base64 hash for SHA-256 algorithm', async () => {
			const hash = await generateCspDigest('alert(1)', 'SHA-256');
			assert.ok(hash.startsWith('sha256-'), `Expected sha256- prefix, got: ${hash}`);
		});

		it('produces a sha384- prefixed hash for SHA-384 algorithm', async () => {
			const hash = await generateCspDigest('alert(1)', 'SHA-384');
			assert.ok(hash.startsWith('sha384-'), `Expected sha384- prefix, got: ${hash}`);
		});

		it('produces a sha512- prefixed hash for SHA-512 algorithm', async () => {
			const hash = await generateCspDigest('alert(1)', 'SHA-512');
			assert.ok(hash.startsWith('sha512-'), `Expected sha512- prefix, got: ${hash}`);
		});

		it('produces a deterministic hash for the same input', async () => {
			const a = await generateCspDigest('hello', 'SHA-256');
			const b = await generateCspDigest('hello', 'SHA-256');
			assert.equal(a, b);
		});

		it('produces different hashes for different inputs', async () => {
			const a = await generateCspDigest('hello', 'SHA-256');
			const b = await generateCspDigest('world', 'SHA-256');
			assert.notEqual(a, b);
		});
	});
	// #endregion
});
