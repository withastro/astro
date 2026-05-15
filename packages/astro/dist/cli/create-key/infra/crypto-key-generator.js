import { createKey, encodeKey } from '../../../core/encryption.js';
class CryptoKeyGenerator {
	async generate() {
		const key = await createKey();
		const encoded = await encodeKey(key);
		return encoded;
	}
}
export { CryptoKeyGenerator };
