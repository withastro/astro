import assert from 'node:assert';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { loadFixture } from './test-utils.ts';

test.describe('React 19 SSR integration', () => {
	test('preserves authored links alongside React resource hints', async () => {
		const fixture = await loadFixture({
			root: new URL('./fixtures/react-19-preloads/', import.meta.url),
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const match = /<astro-island[^>]*>([\s\S]*?)<\/astro-island>/.exec(html);
		assert.ok(match, 'The fixture should render an island');
		const island = match[1];
		for (const rel of ['stylesheet', 'preconnect', 'dns-prefetch', 'preload', 'modulepreload']) {
			assert.ok(island.includes(`rel="${rel}"`), `${rel} should be preserved`);
		}
		if (!createRequire(import.meta.url)('react/package.json').version.startsWith('18.')) {
			assert.ok(island.includes('href="/_astro/test-image.webp"'), 'React hint is preserved too');
		}
		assert.ok(island.includes('<img'), 'Component content should be preserved');
	});
});
