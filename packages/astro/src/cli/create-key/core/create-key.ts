import type { Logger } from '../../../core/logger/core.js';
import { defineCommand } from '../../domain/command.js';
import type { KeyGenerator } from '../definitions.js';

interface Options {
	logger: Logger;
	keyGenerator: KeyGenerator;
}

export const createKeyCommand = defineCommand({
	help: {
		commandName: 'astro create-key',
		tables: {
			Flags: [['--help (-h)', 'See all available flags.']],
		},
		description: 'Generates a key to encrypt props passed to server islands.',
	},
	async run({ logger, keyGenerator }: Options) {
		const key = await keyGenerator.generate();

		logger.info(
			'crypto',
			`Generated a key to encrypt props passed to server islands. To reuse the same key across builds, set this value as ASTRO_KEY in an environment variable on your build server.\n\nASTRO_KEY=${key}`,
		);
	},
});
