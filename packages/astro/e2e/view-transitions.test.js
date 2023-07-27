import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/view-transitions/' });

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('View Transitions', () => {
	test('Moving from page 1 to page 2', async ({ page, astro }) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});

		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page 2
		await page.click('#click-two');
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');

		expect(loads.length, 'There should only be 1 page load').toEqual(1);
	});

	test('Back button is captured', async ({ page, astro }) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});

		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page 2
		await page.click('#click-two');
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');

		// Back to page 1
		await page.goBack();
		p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		expect(loads.length, 'There should only be 1 page load').toEqual(1);
	});

	test('Clicking on a link with nested content', async ({ page, astro }) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});

		// Go to page 4
		await page.goto(astro.resolveUrl('/four'));
		let p = page.locator('#four');
		await expect(p, 'should have content').toHaveText('Page 4');

		// Go to page 1
		await page.click('#click-one');
		p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		expect(loads.length, 'There should only be 1 page load').toEqual(1);
	});

	test('Moving from a page without ViewTransitions triggers a full page navigation', async ({
		page,
		astro,
	}) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});

		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// Go to page 3 which does *not* have ViewTransitions enabled
		await page.click('#click-three');
		p = page.locator('#three');
		await expect(p, 'should have content').toHaveText('Page 3');

		await page.click('#click-two');
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');

		expect(
			loads.length,
			'There should be 2 page loads. The original, then going from 3 to 2'
		).toEqual(2);
	});

	test('Moving from a page without ViewTransitions w/ back button', async ({ page, astro }) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});

		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// Go to page 3 which does *not* have ViewTransitions enabled
		await page.click('#click-three');
		p = page.locator('#three');
		await expect(p, 'should have content').toHaveText('Page 3');

		// Back to page 1
		await page.goBack();
		p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');
	});

	test('Stylesheets in the head are waited on', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// Go to page 2
		await page.click('#click-two');
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');
		await expect(p, 'imported CSS updated').toHaveCSS('font-size', '24px');
	});

	test('astro:load event fires when navigating to new page', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		const p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page 2
		await page.click('#click-two');
		const article = page.locator('#twoarticle');
		await expect(article, 'should have script content').toHaveText('works');
	});

	test('astro:load event fires when navigating directly to a page', async ({ page, astro }) => {
		// Go to page 2
		await page.goto(astro.resolveUrl('/two'));
		const article = page.locator('#twoarticle');
		await expect(article, 'should have script content').toHaveText('works');
	});

	test('astro:beforeload event fires right before the swap', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page 2
		await page.click('#click-two');
		p = page.locator('#two');
		const h = page.locator('html');
		await expect(h, 'imported CSS updated').toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
	});

	test('click hash links does not do navigation', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		const p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// Clicking 1 stays put
		await page.click('#click-one');
		await expect(p, 'should have content').toHaveText('Page 1');
	});

	test('<Image /> component forwards transitions to the <img>', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/image-one'));
		const img = page.locator('img[data-astro-transition-scope]');
		await expect(img).toBeVisible('The image tag should have the transition scope attribute.');
	});
});
