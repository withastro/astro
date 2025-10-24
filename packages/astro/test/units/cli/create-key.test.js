// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createKeyCommand } from '../../../dist/cli/create-key/core/create-key.js';
import { createSpyLogger } from '../test-utils.js';
import { createFakeKeyGenerator, createPassthroughCommandRunner } from './utils.js';

describe('CLI create-key', () => {
	describe('core', () => {
		describe('createKeyCommand', () => {
			it('logs the generated key', async () => {
				const { logger, logs } = createSpyLogger();
				const runner = createPassthroughCommandRunner();
				const keyGenerator = createFakeKeyGenerator('FOO');

				await runner.run(createKeyCommand, { logger, keyGenerator });

				assert.equal(logs[0].type, 'info');
				assert.equal(logs[0].label, 'crypto');
				assert.match(logs[0].message, /ASTRO_KEY=FOO/);
			});
		});
	});
});
