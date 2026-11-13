import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Prerendering with CLOUDFLARE_ENV', () => {
	let fixture: Fixture;
	const warnings: string[] = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/prerender-cloudflare-env/',
		});

		const originalEnv = process.env.CLOUDFLARE_ENV;
		const originalWarn = console.warn;
		process.env.CLOUDFLARE_ENV = 'staging';
		console.warn = (...args: unknown[]) => {
			warnings.push(args.map(String).join(' '));
			originalWarn(...args);
		};
		try {
			await fixture.build();
		} finally {
			console.warn = originalWarn;
			if (originalEnv === undefined) {
				delete process.env.CLOUDFLARE_ENV;
			} else {
				process.env.CLOUDFLARE_ENV = originalEnv;
			}
		}
	});

	after(async () => {
		await fixture.clean();
	});

	it('prerenders with the vars of the selected environment', async () => {
		const html = await fixture.readFile('/client/index.html');
		assert.ok(html.includes('<h1 id="environment">staging</h1>'));
	});

	it('does not warn about a missing environment in the prerender worker config', () => {
		const envWarnings = warnings.filter((w) => w.includes('No environment found in configuration'));
		assert.deepEqual(envWarnings, []);
	});
});
