import { createKey, encodeKey } from '@astrojs/vite-plugin-astro/internal/core/encryption.js';
import type { KeyGenerator } from '../definitions.js';

export class CryptoKeyGenerator implements KeyGenerator {
	async generate(): Promise<string> {
		const key = await createKey();
		const encoded = await encodeKey(key);
		return encoded;
	}
}
