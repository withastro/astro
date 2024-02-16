import * as assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { loadFixture } from '@astrojs/test-utils';

describe('Image CDN', () => {
	const root = new URL('./fixtures/middleware/', import.meta.url);

	describe('when running outside of netlify', () => {
		it('does not enable Image CDN', async () => {
			const fixture = await loadFixture({ root });
			await fixture.build();

			const astronautPage = await fixture.readFile('astronaut/index.html');
			assert.equal(astronautPage.includes(`src="/_astro/astronaut.`), true);
		});
	});

	describe('when running inside of netlify', () => {
		after(() => {
			process.env.NETLIFY = undefined;
			process.env.DISABLE_IMAGE_CDN = undefined;
		});

		it('enables Netlify Image CDN', async () => {
			process.env.NETLIFY = 'true';
			const fixture = await loadFixture({ root });
			await fixture.build();

			const astronautPage = await fixture.readFile('astronaut/index.html');
			assert.equal(astronautPage.includes(`src="/.netlify/image`), true);
		});

		it('respects image CDN opt-out', async () => {
			process.env.NETLIFY = 'true';
			process.env.DISABLE_IMAGE_CDN = 'true';
			const fixture = await loadFixture({ root });
			await fixture.build();

			const astronautPage = await fixture.readFile('astronaut/index.html');
			assert.equal(astronautPage.includes(`src="/_astro/astronaut.`), true);
		});
	});
});
