import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import cloudflare from '../dist/index.js';
import { loadFixture } from './test-utils.ts';

describe('Container API with Cloudflare adapter', () => {
	it('should build and prerender Container API page correctly', async () => {
		const fixture = await loadFixture({
			root: new URL('./fixtures/container-api/', import.meta.url).toString(),
			adapter: cloudflare(),
		});
		await fixture.build();

		const testHtml = await fixture.readFile('client/test.html');
		assert.ok(
			testHtml.includes('Hello World!'),
			`Expected "Hello World!" in output, got: ${testHtml.substring(0, 300)}`,
		);
	});
});
