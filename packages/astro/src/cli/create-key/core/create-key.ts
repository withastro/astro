import type { Logger } from '../../../core/logger/core.js';
import type { KeyGenerator } from '../definitions.js';

interface CreateKeyOptions {
	logger: Logger;
	keyGenerator: KeyGenerator;
}

export async function createKey({ logger, keyGenerator }: CreateKeyOptions) {
	const key = await keyGenerator.generate();

	logger.info(
		'crypto',
		`Generated a key to encrypt props passed to server islands. To reuse the same key across builds, set this value as ASTRO_KEY in an environment variable on your build server.

ASTRO_KEY=${key}`,
	);
}
