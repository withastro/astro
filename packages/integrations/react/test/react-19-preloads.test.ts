import assert from 'node:assert';
import { before, test } from 'node:test';
import { loadFixture } from './test-utils.ts';

test.describe('React 19 SSR integration', () => {
	let island: string;

	before(async () => {
		const fixture = await loadFixture({
			root: new URL('./fixtures/react-19-preloads/', import.meta.url),
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const islandPattern = /<astro-island[^>]*>([\s\S]*?)<\/astro-island>/;
		const match = islandPattern.exec(html);
		island = match ? match[1] : '';
	});

	test('should strip preloads to prevent invalid HTML inside astro-islands', () => {
		assert.ok(!island.includes('rel="preload"'), 'React 19: preloads should be stripped');
		assert.ok(island.includes('<img'), 'Component content should be preserved');
	});

	test('should keep <link> tags rendered by the component', () => {
		assert.ok(island.includes('<link rel="stylesheet" href="/widget.css"'));
		assert.ok(island.includes('<link rel="preconnect" href="https://example.com"'));
	});
});
