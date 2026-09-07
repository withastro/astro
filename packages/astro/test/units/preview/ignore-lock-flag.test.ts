import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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
});
