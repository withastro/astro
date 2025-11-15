import { createKey, encodeKey } from '../../../core/encryption.js';
import type { KeyGenerator } from '../definitions.js';

export function createCryptoKeyGenerator(): KeyGenerator {
	return {
		async generate() {
			const key = await createKey();
			const encoded = await encodeKey(key);
			return encoded;
		},
	};
}
