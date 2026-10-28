import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture, type Fixture } from '../../test-utils.ts';
import { preview } from '../../../dist/cli/preview/index.js';

describe('astro preview --ignore-lock', () => {
	it('rejects --ignore-lock combined with --force', async () => {
		await assert.rejects(
			() => preview({ flags: { _: ['', '', 'preview'], ignoreLock: true, force: true } }),
			(err) => {
				assert.ok(err instanceof Error);
				assert.match(err.message, /`--force` and `--ignore-lock` cannot be used together/);
				return true;
			},
		);
	});

	it('rejects --ignore-lock combined with --background', async () => {
		await assert.rejects(
			() =>
				preview({
					flags: { _: ['', '', 'preview'], ignoreLock: true, background: true },
				}),
			(err) => {
				assert.ok(err instanceof Error);
				assert.match(err.message, /`--ignore-lock` cannot be used together with `--background`/);
				assert.match(err.message, /astro preview stop/);
				assert.match(err.message, /astro preview status/);
				assert.match(err.message, /astro preview logs/);
				return true;
			},
		);
	});

	it('starts a foreground server when an AI agent is detected, instead of refusing', async () => {
		const fixture: Fixture = await loadFixture({
			root: './fixtures/astro-preview-allowed-hosts/',
		});
		await fixture.build();
		process.env.CLAUDECODE = '1';
		try {
			const server = await preview({
				flags: {
					_: ['', '', 'preview'],
					ignoreLock: true,
					port: 4733,
					root: './test/fixtures/astro-preview-allowed-hosts/',
					silent: true,
				},
			});
			assert.ok(server, 'expected the preview server to start in the foreground');
			try {
				assert.ok(server.urls?.local, 'expected the preview server to expose a URL');
				const response = await fetch(server.urls.local[0]);
				assert.equal(response.status, 200);
			} finally {
				await server.stop();
			}
		} finally {
			delete process.env.CLAUDECODE;
		}
	});
});
