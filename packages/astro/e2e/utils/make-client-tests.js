import { expect } from '@playwright/test';
import { scrollToElement, waitForHydrate } from '../test-utils.js';

export const makeClientTests = ({ test, pageUrl, canReplayClicks }) => {
	test('client:idle', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl(pageUrl));

		const counter = page.locator('#client-idle');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		await waitForHydrate(page, counter);

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('client:load', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl(pageUrl));

		const counter = page.locator('#client-load');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		await waitForHydrate(page, counter);

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('client:visible', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl(pageUrl));

		// Make sure the component is on screen to trigger hydration
		const counter = page.locator('#client-visible');
		// NOTE: Use custom implementation instead of `counter.scrollIntoViewIfNeeded`
		// as Playwright's function doesn't take into account of `counter` being hydrated
		// and losing the original DOM reference.
		await scrollToElement(counter);

		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		await waitForHydrate(page, counter);

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('client:media', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl(pageUrl));

		const counter = page.locator('#client-media');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');
		const inc = counter.locator('.increment');
		await inc.click();
		await expect(count, 'component not hydrated yet').toHaveText('0');

		// Reset the viewport to hydrate the component (max-width: 50rem)
		await page.setViewportSize({ width: 414, height: 1124 });
		await waitForHydrate(page, counter);

		await inc.click();

		if (canReplayClicks) {
			// SolidJS has a hydration script that automatically captures
			// and replays click and input events on Hydration:
			// https://www.solidjs.com/docs/latest#hydrationscript
			// so in total there are two click events.
			await expect(count, 'count incremented by 2').toHaveText('2');
		} else {
			await expect(count, 'count incremented by 1').toHaveText('1');
		}
	});

	test('client:only', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl(pageUrl));

		const label = page.locator('#client-only');
		await expect(label, 'component is visible').toBeVisible();

		await expect(label, 'slot text is visible').toHaveText('Framework client:only component');
	});
};
