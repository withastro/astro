import assert from 'node:assert';
import { test } from 'node:test';
import { loadFixture } from './test-utils.ts';

test.describe('React 19 SSR integration', () => {
	test('should strip preloads to prevent invalid HTML inside astro-islands', async () => {
		const fixture = await loadFixture({
			root: new URL('./fixtures/react-19-preloads/', import.meta.url),
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const islandPattern = /<astro-island[^>]*>([\s\S]*?)<\/astro-island>/;
		const match = islandPattern.exec(html);
		const island = match ? match[1] : '';

		assert.ok(!island.includes('rel="preload"'), 'React 19: preloads should be stripped');
		assert.ok(island.includes('<img'), 'Component content should be preserved');
	});
});
