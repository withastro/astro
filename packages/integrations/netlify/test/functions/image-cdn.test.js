import { describe } from 'node:test';
import { loadFixture } from '@astrojs/test-utils';
import { expect } from 'chai';

describe('Image CDN', () => {
	const root = new URL('./fixtures/middleware/', import.meta.url);

	describe('when running outside of netlify', () => {
		it('does not enable Image CDN', async () => {
			const fixture = await loadFixture({ root });
			await fixture.build();

			const astronautPage = await fixture.readFile('astronaut/index.html');
			expect(astronautPage).contains(`src="/_astro/astronaut.`);
		});
	});

	describe('when running inside of netlify', () => {
		it('enables Netlify Image CDN', async () => {
			process.env.NETLIFY = 'true';
			const fixture = await loadFixture({ root });
			await fixture.build();

			const astronautPage = await fixture.readFile('astronaut/index.html');
			expect(astronautPage).contains(`src="/.netlify/image`);

			process.env.NETLIFY = undefined;
		});

		it('respects image CDN opt-out', async () => {
			process.env.NETLIFY = 'true';
			process.env.DISABLE_IMAGE_CDN = 'true';
			const fixture = await loadFixture({ root });
			await fixture.build();

			const astronautPage = await fixture.readFile('astronaut/index.html');
			expect(astronautPage).contains(`src="/_astro/astronaut.`);

			process.env.NETLIFY = undefined;
			process.env.DISABLE_IMAGE_CDN = undefined;
		});
	});
});
