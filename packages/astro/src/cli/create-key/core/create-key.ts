import type { Logger } from '../../../core/logger/core.js';
import type { HelpDisplay, KeyGenerator } from '../definitions.js';

interface CreateKeyOptions {
	logger: Logger;
	keyGenerator: KeyGenerator;
	helpDisplay: HelpDisplay;
}

export async function createKey({ logger, keyGenerator, helpDisplay }: CreateKeyOptions) {
	if (helpDisplay.shouldFire()) {
		return helpDisplay.show({
			commandName: 'astro create-key',
			tables: {
				Flags: [['--help (-h)', 'See all available flags.']],
			},
			description: 'Generates a key to encrypt props passed to Server islands.',
		});
	}

	const key = await keyGenerator.generate();

	logger.info(
		'crypto',
		`Generated a key to encrypt props passed to server islands. To reuse the same key across builds, set this value as ASTRO_KEY in an environment variable on your build server.

ASTRO_KEY=${key}`,
	);
}
