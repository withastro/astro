import { expect } from 'chai';

const NETLIFY_TEST_URL = 'https://curious-boba-495d6d.netlify.app';

describe('Hosted Netlify Tests', () => {
	it('Image endpoint works', async () => {
		const image = await fetch(
			NETLIFY_TEST_URL + '/_image?href=%2F_astro%2Fpenguin.e9c64733.png&w=300&f=webp'
		);

		expect(image.status).to.equal(200);
	});
});
