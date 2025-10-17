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

				assert.equal(logs[0].type, 'info');
				assert.equal(logs[0].label, 'crypto');
				assert.match(logs[0].message, /ASTRO_KEY=FOO/);
			});
		});
	});
});
