import { defineCommand } from '../../domain/command.js';
const createKeyCommand = defineCommand({
	help: {
		commandName: 'astro create-key',
		tables: {
			Flags: [['--help (-h)', 'See all available flags.']],
		},
		description: 'Generates a key to encrypt props passed to server islands.',
	},
	async run({ logger, keyGenerator }) {
		const key = await keyGenerator.generate();
		logger.info(
			'crypto',
			`Generated a key to encrypt props passed to server islands. To reuse the same key across builds, set this value as ASTRO_KEY in an environment variable on your build server.

ASTRO_KEY=${key}`,
		);
	},
});
export { createKeyCommand };
