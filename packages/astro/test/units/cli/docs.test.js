// @ts-check
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { openDocsCommand } from '../../../dist/cli/docs/core/open-docs.js';
import { ProcessCloudIdeProvider } from '../../../dist/cli/docs/infra/process-cloud-ide-provider.js';
import { SpyLogger } from '../test-utils.js';
import {
	FakeCloudIdeProvider,
	FakeOperatingSystemProvider,
	PassthroughCommandRunner,
	SpyCommandExecutor,
} from './utils.js';

describe('CLI docs', () => {
	describe('core', () => {
		describe('openDocsCommand', () => {
			it('logs an error if the platform is unsupported', async () => {
				const logger = new SpyLogger();
				const runner = new PassthroughCommandRunner();
				const operatingSystemProvider = new FakeOperatingSystemProvider('aix');
				const cloudIdeProvider = new FakeCloudIdeProvider(null);
				const commandExecutor = new SpyCommandExecutor();

				await runner.run(openDocsCommand, {
					url: 'https://astro.build/',
					logger,
					operatingSystemProvider,
					commandExecutor,
					cloudIdeProvider,
				});

				assert.equal(logger.logs[0].type, 'error');
				assert.match(logger.logs[0].message, /It looks like your platform/);
				assert.deepStrictEqual(commandExecutor.inputs, []);
			});

			it('executes the command correctly on supported platforms', async () => {
				const logger = new SpyLogger();
				const runner = new PassthroughCommandRunner();
				const operatingSystemProvider = new FakeOperatingSystemProvider('linux');
				const cloudIdeProvider = new FakeCloudIdeProvider(null);
				const commandExecutor = new SpyCommandExecutor();

				await runner.run(openDocsCommand, {
					url: 'https://astro.build/',
					logger,
					operatingSystemProvider,
					commandExecutor,
					cloudIdeProvider,
				});

				assert.deepStrictEqual(logger.logs, []);
				assert.equal(commandExecutor.inputs.length, 1);
				assert.equal(commandExecutor.inputs[0].args?.at(-1), 'https://astro.build/');
			});
		});
	});

	describe('infra', () => {
		describe('ProcessCloudIdeProvider', () => {
			/** @type {string | undefined} */
			let prev;

			before(() => {
				prev = process.env.GITPOD_REPO_ROOT;
				delete process.env.GITPOD_REPO_ROOT;
			});

			after(() => {
				if (prev) {
					process.env.GITPOD_REPO_ROOT = prev;
				}
			});

			it('handles gitpod', () => {
				process.env.GITPOD_REPO_ROOT = '/foo/bar/';
				const cloudIdeaProvider = new ProcessCloudIdeProvider();

				const platform = cloudIdeaProvider.name;

				assert.equal(platform, 'gitpod');
			});
		});
	});
});
