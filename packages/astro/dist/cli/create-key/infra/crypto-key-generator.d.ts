import type { KeyGenerator } from '../definitions.js';
export declare class CryptoKeyGenerator implements KeyGenerator {
	generate(): Promise<string>;
}
