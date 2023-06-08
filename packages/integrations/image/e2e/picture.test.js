import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/basic-picture/' });

test.describe('Basic picture', () => {
	test.describe('Production', () => {
		let previewServer;

		test.beforeEach(async ({ astro }) => {
			await astro.build();
			previewServer = await astro.preview();
		});

		test.afterEach(async () => {
			await previewServer.stop();
		});

		test('requests chosen src', async ({ page, astro }) => {
			/** @type {string[]} */
			const requests = [];

			page.on('request', (request) => requests.push(request.url()));

			await page.goto(astro.resolveUrl('/'));

			await page.waitForLoadState('networkidle');

			await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

			const pictureElements = await page.$$('picture');
			const imgAttributes = await Promise.all(pictureElements.map(getAttributes));
			const expectedExtensions = await Promise.all(
				imgAttributes
					.filter(distinctBySources)
					.map(({ id }) => (id === 'webp-only' ? 'webp' : 'avif'))
			);
			const imageRequests = requests.filter((url) => url !== astro.resolveUrl('/'));
			const requestedExtensions = imageRequests.map((url) => url.slice(url.lastIndexOf('.') + 1));
			expect(requestedExtensions).toEqual(expectedExtensions);
		});
	});
});

/** @typedef {{ id: string, src: string, types: string[] }} Attributes */

/**
 * @param {Attributes} attributes
 * @param {number} index
 * @param {Attributes[]} array
 * @returns {boolean}
 */
function distinctBySources({ src, types }, index, array) {
	return array.findIndex((attrs) => attrs.src === src && setsEqual(attrs.types, types)) === index;
}

/**
 * @param {import('@playwright/test').ElementHandle} picture
 * @returns {Attributes}
 */
async function getAttributes(picture) {
	const img = await picture.$('img');
	const sources = await picture.$$('source');
	const types = sources.map((source) => source.getAttribute('type'));
	return {
		id: await img.getAttribute('id'),
		src: await img.getAttribute('src'),
		types: new Set(await Promise.all(types)),
	};
}

/**
 * @param {Set} a
 * @param {Set} b
 * @returns {boolean}
 */
function setsEqual(a, b) {
	if (a.size !== b.size) {
		return false;
	}
	for (const elem of a) {
		if (!b.has(elem)) {
			return false;
		}
	}
	return true;
}
