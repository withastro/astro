// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createKey } from '../../../dist/cli/create-key/core/create-key.js';
import { createSpyLogger } from '../test-utils.js';

describe('CLI create-key', () => {
	describe('core', () => {
		describe('create-key', () => {
			it('logs the generated key', async () => {
				const { logger, logs } = createSpyLogger();

				await createKey({
					logger,
					keyGenerator: {
						generate: async () => 'FOO',
					},
				});

				assert.deepStrictEqual(logs, [
					{
						type: 'info',
						label: 'crypto',
						message:
							'Generated a key to encrypt props passed to Server islands. To reuse the same key across builds, set this value as ASTRO_KEY in an environment variable on your build server.\n\nASTRO_KEY=FOO',
					},
				]);
			});
		});
	});
});
