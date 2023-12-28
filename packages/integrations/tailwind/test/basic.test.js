import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('Basic', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/basic/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works', async () => {
			const astroChunkDir = await fixture.readdir('/_astro');

			let css = '';
			for (const file of astroChunkDir) {
				if (file.endsWith('.css')) {
					css += await fixture.readFile(`/_astro/${file}`);
				}
			}

			expect(css).to.include('box-sizing:border-box;'); // base css
			expect(css).to.include('text-red-500'); // class css
			expect(css).to.match(/\.a\[data-astro-cid-.*?\] \.b\[data-astro-cid-.*?\]/); // nesting
		});
	});
});
