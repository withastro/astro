import { expect } from 'chai';

const VERCEL_TEST_URL = 'https://astro-vercel-image-test.vercel.app';

describe('Hosted Vercel Tests', () => {
	it('shows images', async () => {
		const image = await fetch(
			VERCEL_TEST_URL + '/_image?href=%2F_astro%2Fpenguin.e9c64733.png&w=300&f=webp'
		);

		expect(image.status).to.equal(200);
	});
});
