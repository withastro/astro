import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
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

		const testHtml = fs.readFileSync(
			new URL('./fixtures/container-api/dist/client/test.html', import.meta.url),
			'utf-8',
		);
		assert.ok(
			testHtml.includes('Hello World!'),
			`Expected "Hello World!" in output, got: ${testHtml.substring(0, 300)}`,
		);
	});
});
