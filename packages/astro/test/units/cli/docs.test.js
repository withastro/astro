// @ts-check
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { openDocsCommand } from '../../../dist/cli/docs/core/open-docs.js';
import { createProcessCloudIdeProvider } from '../../../dist/cli/docs/infra/process-cloud-ide-provider.js';
import { createSpyLogger } from '../test-utils.js';
import {
	createFakeCloudIdeProvider,
	createFakeOperatingSystemProvider,
	createPassthroughCommandRunner,
	createSpyCommandExecutor,
} from './utils.js';

describe('CLI docs', () => {
	describe('core', () => {
		describe('openDocsCommand', () => {
			it('logs an error if the platform is unsupported', async () => {
				const { logger, logs } = createSpyLogger();
				const runner = createPassthroughCommandRunner();
				const operatingSystemProvider = createFakeOperatingSystemProvider('aix');
				const cloudIdeProvider = createFakeCloudIdeProvider(null);
				const { commandExecutor, inputs } = createSpyCommandExecutor();

				await runner.run(openDocsCommand, {
					url: 'https://astro.build/',
					logger,
					operatingSystemProvider,
					commandExecutor,
					cloudIdeProvider,
				});

				assert.equal(logs[0].type, 'error');
				assert.match(logs[0].message, /It looks like your platform/);
				assert.deepStrictEqual(inputs, []);
			});

			it('executes the command correctly on supported platforms', async () => {
				const { logger, logs } = createSpyLogger();
				const runner = createPassthroughCommandRunner();
				const operatingSystemProvider = createFakeOperatingSystemProvider('linux');
				const cloudIdeProvider = createFakeCloudIdeProvider(null);
				const { commandExecutor, inputs } = createSpyCommandExecutor();

				await runner.run(openDocsCommand, {
					url: 'https://astro.build/',
					logger,
					operatingSystemProvider,
					commandExecutor,
					cloudIdeProvider,
				});

				assert.deepStrictEqual(logs, []);
				assert.equal(inputs.length, 1);
				assert.equal(inputs[0].args?.at(-1), 'https://astro.build/');
			});
		});
	});

	describe('infra', () => {
		describe('createProcessCloudIdeProvider()', () => {
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
				const cloudIdeaProvider = createProcessCloudIdeProvider();

				const platform = cloudIdeaProvider.name;

				assert.equal(platform, 'gitpod');
			});
		});
	});
});
