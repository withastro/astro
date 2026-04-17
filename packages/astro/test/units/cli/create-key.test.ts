import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createKeyCommand } from '../../../dist/cli/create-key/core/create-key.js';
import { FakeKeyGenerator, PassthroughCommandRunner, SpyLogger } from './utils.ts';

describe('CLI create-key', () => {
	describe('core', () => {
		describe('createKeyCommand', () => {
			it('logs the generated key', async () => {
				const logger = new SpyLogger();
				const runner = new PassthroughCommandRunner();
				const keyGenerator = new FakeKeyGenerator('FOO');

				await runner.run(createKeyCommand, { logger, keyGenerator });

				assert.equal(logger.logs[0].type, 'info');
				assert.equal(logger.logs[0].label, 'crypto');
				assert.match(logger.logs[0].message, /ASTRO_KEY=FOO/);
			});
		});
	});
});
