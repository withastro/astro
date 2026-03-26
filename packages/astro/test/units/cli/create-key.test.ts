import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { KeyGenerator } from '../../../src/cli/create-key/definitions.js';
import type { CommandRunner } from '../../../src/cli/definitions.js';
import type { AnyCommand } from '../../../src/cli/domain/command.js';
import { createKeyCommand } from '../../../dist/cli/create-key/core/create-key.js';
import { SpyLogger } from '../test-utils.js';

class FakeKeyGenerator implements KeyGenerator {
	readonly #key: string;

	constructor(key: string) {
		this.#key = key;
	}

	async generate(): Promise<string> {
		return this.#key;
	}
}

class PassthroughCommandRunner implements CommandRunner {
	run<T extends AnyCommand>(
		command: T,
		...args: Parameters<T['run']>
	): ReturnType<T['run']> | undefined {
		return command.run(...args) as ReturnType<T['run']>;
	}
}

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
