import { expect } from 'chai';
import { testImageService } from './test-image-service.js';
import { loadFixture } from './test-utils.js';

describe('astro:assets - delete images that are unused', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	describe('build ssg', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-deletion/',
				image: {
					service: testImageService(),
				},
			});

			await fixture.build();
		});

		it('should delete images that are only used for optimization', async () => {
			const imagesOnlyOptimized = await fixture.glob('_astro/onlyone.*.*');
			expect(imagesOnlyOptimized).to.have.lengthOf(1);
		});

		it('should not delete images that are used in other contexts', async () => {
			const imagesUsedElsewhere = await fixture.glob('_astro/twoofus.*.*');
			expect(imagesUsedElsewhere).to.have.lengthOf(2);
		});

		it('should not delete images that are also used through query params', async () => {
			const imagesUsedElsewhere = await fixture.glob('_astro/url.*.*');
			expect(imagesUsedElsewhere).to.have.lengthOf(2);
		});
	});
});
