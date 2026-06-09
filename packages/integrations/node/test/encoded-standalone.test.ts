import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { PreviewServer } from 'astro';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Encoded Pathname (standalone)', () => {
	let fixture: Fixture;
	let devPreview: PreviewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/encoded-standalone/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
			trailingSlash: 'never',
		});
		await fixture.build();
		devPreview = await fixture.preview();
	});

	after(async () => {
		await devPreview.stop();
	});

	it('ASCII prerendered route serves 200 without trailing slash', async () => {
		const response = await fixture.fetch('/hello');
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.equal(html.includes('<h1>hello</h1>'), true);
	});

	it('Non-ASCII prerendered route serves 200 without trailing slash', async () => {
		const response = await fixture.fetch('/什么');
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.equal(html.includes('<h1>什么</h1>'), true);
	});
});
