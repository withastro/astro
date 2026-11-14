import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import cloudflare from '../dist/index.js';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Prerendered pages with nodejs_compat', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/prerender-nodejs-compat/', import.meta.url).toString(),
			adapter: cloudflare(),
		});
		await fixture.build();
	});

	after(async () => {
		await fixture.clean();
	});

	it('renders valid HTML instead of [object Object]', async () => {
		const html = await fixture.readFile('/client/index.html');
		assert.ok(
			html.includes('<h1>hello from prerender</h1>'),
			`Expected valid HTML but got: ${JSON.stringify(html.slice(0, 100))}`,
		);
		assert.ok(
			!html.includes('[object Object]'),
			'Expected no [object Object] in prerendered output',
		);
	});
});
