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
		page.addListener('console', (data) => {
			console.log(data);
		});

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
});
