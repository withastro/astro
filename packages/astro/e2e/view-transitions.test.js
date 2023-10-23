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

function scrollToBottom(page) {
	return page.evaluate(() => {
		window.scrollY = document.documentElement.scrollHeight;
		window.dispatchEvent(new Event('scroll'));
	});
}

function collectPreloads(page) {
	return page.evaluate(() => {
		window.preloads = [];
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) =>
				mutation.addedNodes.forEach((node) => {
					if (node.nodeName === 'LINK' && node.rel === 'preload') preloads.push(node.href);
				})
			);
		});
		observer.observe(document.head, { childList: true });
	});
}

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

	test('Moving to a page without ViewTransitions triggers a full page navigation', async ({
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

		expect(
			loads.length,
			'There should be 2 page loads. The original, then going from 3 to 2'
		).toEqual(2);
	});

	test('Moving within a page without ViewTransitions does not trigger a full page navigation', async ({
		page,
		astro,
	}) => {
		const loads = [];
		page.addListener('load', async (p) => {
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

		// click a hash link to navigate further down the page
		await page.click('#click-hash');
		// still on page 3
		p = page.locator('#three');
		await expect(p, 'should have content').toHaveText('Page 3');

		// check that we are further down the page
		const Y = await page.evaluate(() => window.scrollY);
		expect(Y, 'The target is further down the page').toBeGreaterThan(0);

		expect(
			loads.length,
			'There should be only 2 page loads (for page one & three), but no additional loads for the hash change'
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

		await collectPreloads(page);

		// Go to page 2
		await page.click('#click-two');
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');
		await expect(p, 'imported CSS updated').toHaveCSS('font-size', '24px');
		const preloads = await page.evaluate(() => window.preloads);
		expect(preloads.length === 1 && preloads[0].endsWith('/two.css')).toBeTruthy();
	});

	test('astro:page-load event fires when navigating to new page', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		const p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page 2
		await page.click('#click-two');
		const article = page.locator('#twoarticle');
		await expect(article, 'should have script content').toHaveText('works');
	});

	test('astro:page-load event fires when navigating directly to a page', async ({
		page,
		astro,
	}) => {
		// Go to page 2
		await page.goto(astro.resolveUrl('/two'));
		const article = page.locator('#twoarticle');
		await expect(article, 'should have script content').toHaveText('works');
	});

	test('astro:after-swap event fires right after the swap', async ({ page, astro }) => {
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

	test('No page rendering during swap()', async ({ page, astro }) => {
		let transitions = 0;
		page.on('console', (msg) => {
			if (msg.type() === 'info' && msg.text() === 'transitionstart') ++transitions;
		});

		// Go to page 1
		await page.goto(astro.resolveUrl('/listener-one'));
		let p = page.locator('#totwo');
		await expect(p, 'should have content').toHaveText('Go to listener two');
		// on load a CSS transition is started triggered by a class on the html element
		expect(transitions).toBeLessThanOrEqual(1);
		const transitionsBefore = transitions;
		// go to page 2
		await page.click('#totwo');
		p = page.locator('#toone');
		await expect(p, 'should have content').toHaveText('Go to listener one');
		// swap() resets that class, the after-swap listener sets it again.
		// the temporarily missing class must not trigger page rendering
		expect(transitions).toEqual(transitionsBefore);
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

	test('click self link (w/o hash) does not do navigation', async ({ page, astro }) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});
		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		const p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// Clicking href="" stays on page
		await page.click('#click-self');
		await expect(p, 'should have content').toHaveText('Page 1');
		expect(loads.length, 'There should only be 1 page load').toEqual(1);
	});

	test('Scroll position restored on back button', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/long-page'));
		let article = page.locator('#longpage');
		await expect(article, 'should have script content').toBeVisible('exists');

		await scrollToBottom(page);
		const oldScrollY = await page.evaluate(() => window.scrollY);

		// go to page long-page
		await page.click('#click-one');
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// Back to page 1
		await page.goBack();

		const newScrollY = await page.evaluate(() => window.scrollY);
		expect(oldScrollY).toEqual(newScrollY);
	});

	test('Fragment scroll position restored on back button', async ({ page, astro }) => {
		// Go to the long page
		await page.goto(astro.resolveUrl('/long-page'));
		let locator = page.locator('#longpage');
		await expect(locator).toBeInViewport();

		// Scroll down to middle fragment
		await page.click('#click-scroll-down');
		locator = page.locator('#click-one-again');
		await expect(locator).toBeInViewport();

		// Scroll up to top fragment
		await page.click('#click-scroll-up');
		locator = page.locator('#longpage');
		await expect(locator).toBeInViewport();

		// Back to middle of the page
		await page.goBack();
		locator = page.locator('#click-one-again');
		await expect(locator).toBeInViewport();
	});

	test('Scroll position restored when transitioning back to fragment', async ({ page, astro }) => {
		// Go to the long page
		await page.goto(astro.resolveUrl('/long-page'));
		let locator = page.locator('#longpage');
		await expect(locator).toBeInViewport();

		// Scroll down to middle fragment
		await page.click('#click-scroll-down');
		locator = page.locator('#click-one-again');
		await expect(locator).toBeInViewport();

		// goto page 1
		await page.click('#click-one-again');
		locator = page.locator('#one');
		await expect(locator).toHaveText('Page 1');

		// Back to middle of the previous page
		await page.goBack();
		locator = page.locator('#click-one-again');
		await expect(locator).toBeInViewport();
	});

	test('Scroll position restored on forward button', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page long-page
		await page.click('#click-longpage');
		let article = page.locator('#longpage');
		await expect(article, 'should have script content').toBeVisible('exists');

		await scrollToBottom(page);
		const oldScrollY = await page.evaluate(() => window.scrollY);

		// Back to page 1
		await page.goBack();

		// Go forward
		await page.goForward();
		article = page.locator('#longpage');
		await expect(article, 'should have script content').toBeVisible('exists');

		const newScrollY = await page.evaluate(() => window.scrollY);
		expect(oldScrollY).toEqual(newScrollY);
	});

	test('Fragment scroll position restored on forward button', async ({ page, astro }) => {
		// Go to the long page
		await page.goto(astro.resolveUrl('/long-page'));
		let locator = page.locator('#longpage');
		await expect(locator).toBeInViewport();

		// Scroll down to middle fragment
		await page.click('#click-scroll-down');
		locator = page.locator('#click-one-again');
		await expect(locator).toBeInViewport();

		// Scroll back to top
		await page.goBack();
		locator = page.locator('#longpage');
		await expect(locator).toBeInViewport();

		// Forward to middle of page
		await page.goForward();
		locator = page.locator('#click-one-again');
		await expect(locator).toBeInViewport();
	});

	test('<Image /> component forwards transitions to the <img>', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/image-one'));
		const img = page.locator('img[data-astro-transition-scope]');
		await expect(img).toBeVisible('The image tag should have the transition scope attribute.');
	});

	test('<video> can persist using transition:persist', async ({ page, astro }) => {
		const getTime = () => document.querySelector('video').currentTime;

		// Go to page 1
		await page.goto(astro.resolveUrl('/video-one'));
		const vid = page.locator('video');
		await expect(vid).toBeVisible();
		const firstTime = await page.evaluate(getTime);

		// Navigate to page 2
		await page.click('#click-two');
		const p = page.locator('#video-two');
		await expect(p).toBeVisible();
		const secondTime = await page.evaluate(getTime);

		expect(secondTime).toBeGreaterThanOrEqual(firstTime);
	});

	test('Islands can persist using transition:persist', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/island-one'));
		let cnt = page.locator('.counter pre');
		await expect(cnt).toHaveText('5');

		await page.click('.increment');
		await expect(cnt).toHaveText('6');

		// Navigate to page 2
		await page.click('#click-two');
		const p = page.locator('#island-two');
		await expect(p).toBeVisible();
		cnt = page.locator('.counter pre');
		// Count should remain
		await expect(cnt).toHaveText('6');
	});

	test('Scripts are only executed once', async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		const p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page 2
		await page.click('#click-two');
		const article = page.locator('#twoarticle');
		await expect(article, 'should have script content').toHaveText('works');

		const meta = page.locator('[name="script-executions"]');
		await expect(meta).toHaveAttribute('content', '0');
	});

	test('Navigating to the same path but with different query params should result in transition', async ({
		page,
		astro,
	}) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});

		// Go to page 1
		await page.goto(astro.resolveUrl('/query'));
		let p = page.locator('#query-page');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page 2
		await page.click('#click-two');
		p = page.locator('#query-page');
		await expect(p, 'should have content').toHaveText('Page 2');

		await expect(loads.length, 'There should only be 1 page load').toEqual(1);
	});

	test('Importing ViewTransitions w/o using the component must not mess with history', async ({
		page,
		astro,
	}) => {
		const loads = [];
		page.addListener('load', async (p) => {
			loads.push(p);
		});
		// Go to the half bakeed page
		await page.goto(astro.resolveUrl('/half-baked'));
		let p = page.locator('#half-baked');
		await expect(p, 'should have content').toHaveText('Half Baked');

		// click a hash link to navigate further down the page
		await page.click('#click-hash');
		// still on page
		p = page.locator('#half-baked');
		await expect(p, 'should have content').toHaveText('Half Baked');

		// go back within same page without reloading
		await page.goBack();
		p = page.locator('#half-baked');
		await expect(p, 'should have content').toHaveText('Half Baked');

		expect(
			loads.length,
			'There should be only 1 page load. No additional loads for going back on same page'
		).toEqual(1);
	});

	test('Navigation also swaps the attributes of the document root', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/some-attributes'));
		let p = page.locator('#heading');
		await expect(p, 'should have content').toHaveText('Page with some attributes');

		let h = page.locator('html');
		await expect(h, 'should have content').toHaveAttribute('lang', 'en');

		await page.click('#click-other-attributes');
		p = page.locator('#heading');
		await expect(p, 'should have content').toHaveText('Page with other attributes');

		h = page.locator('html');
		await expect(h, 'should have content').toHaveAttribute('lang', 'es');
		await expect(h, 'should have content').toHaveAttribute('style', 'background-color: green');
		await expect(h, 'should have content').toHaveAttribute('data-other-name', 'value');
		await expect(h, 'should have content').toHaveAttribute('data-astro-fake', 'value');
		await expect(h, 'should have content').toHaveAttribute('data-astro-transition', 'forward');
		await expect(h, 'should be absent').not.toHaveAttribute('class', /.*/);
	});

	test('Link with data-astro-reload attribute should trigger page load, no tranistion', async ({
		page,
		astro,
	}) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});

		// Go to page 4
		await page.goto(astro.resolveUrl('/four'));
		let p = page.locator('#four');
		await expect(p, 'should have content').toHaveText('Page 4');

		// go to page 2
		await page.click('#click-two');
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');

		expect(loads.length, 'There should be 2 page load').toEqual(2);
	});

	test('Link with download attribute should trigger download, no transition', async ({
		page,
		astro,
	}) => {
		// Go to page 4
		await page.goto(astro.resolveUrl('/four'));
		let p = page.locator('#four');
		await expect(p, 'should have content').toHaveText('Page 4');

		// Start waiting for download before clicking. Note no await.
		const downloadPromise = page.waitForEvent('download', { timeout: 4000 });
		await page.click('#click-logo');
		await downloadPromise;
	});

	test('data-astro-reload not required for non-html content', async ({ page, astro }) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});
		// Go to page 4
		await page.goto(astro.resolveUrl('/four'));
		let p = page.locator('#four');
		await expect(p, 'should have content').toHaveText('Page 4');

		await page.click('#click-svg');
		p = page.locator('svg');
		await expect(p).toBeVisible();
		expect(loads.length, 'There should be 2 page load').toEqual(2);
	});

	test('Scroll position is restored on back navigation from page w/o ViewTransitions', async ({
		page,
		astro,
	}) => {
		// Go to middle of long page
		await page.goto(astro.resolveUrl('/long-page#click-external'));

		let locator = page.locator('#click-external');
		await expect(locator).toBeInViewport();

		// Go to a page that has not enabled ViewTransistions
		await page.click('#click-external');
		locator = page.locator('#three');
		await expect(locator).toHaveText('Page 3');

		// Scroll back to long page
		await page.goBack();
		locator = page.locator('#click-external');
		await expect(locator).toBeInViewport();
	});

	test("Non transition navigation doesn't loose handlers", async ({ page, astro }) => {
		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page 3
		await page.click('#click-three');
		p = page.locator('#three');
		await expect(p, 'should have content').toHaveText('Page 3');

		// go to page 5
		await page.click('#click-five');
		p = page.locator('#five');
		await expect(p, 'should have content').toHaveText('Page 5');

		await page.goBack();
		p = page.locator('#three');
		await expect(p, 'should have content').toHaveText('Page 3');

		await page.goBack();
		p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');
	});

	test('Moving to a page which redirects to another', async ({ page, astro }) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});

		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page 2
		await page.click('#click-redirect-two');
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');

		// go back
		await page.goBack();
		p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		expect(
			loads.length,
			'There should only be the initial page load and two normal transitions'
		).toEqual(1);
	});

	test('Redirect to external site causes page load', async ({ page, astro }) => {
		const loads = [];
		page.addListener('load', (p) => {
			loads.push(p.title());
		});

		// Go to page 1
		await page.goto(astro.resolveUrl('/one'));
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to external page
		await page.click('#click-redirect-external');
		// doesn't work for playwright when we are too fast
		await page.waitForTimeout(1000);
		p = page.locator('h1');
		await expect(p, 'should have content').toBeVisible();

		expect(loads.length, 'There should be 2 page loads').toEqual(2);
	});

	test('client:only styles are retained on transition (1/2)', async ({ page, astro }) => {
		const totalExpectedStyles = 8;

		await page.goto(astro.resolveUrl('/client-only-one'));
		let msg = page.locator('.counter-message');
		await expect(msg).toHaveText('message here');

		let styles = await page.locator('style').all();
		expect(styles.length).toEqual(totalExpectedStyles);

		await page.click('#click-two');

		let pageTwo = page.locator('#page-two');
		await expect(pageTwo, 'should have content').toHaveText('Page 2');

		styles = await page.locator('style').all();
		expect(styles.length).toEqual(totalExpectedStyles, 'style count has not changed');
	});

	test('client:only styles are retained on transition (2/2)', async ({ page, astro }) => {
		const totalExpectedStyles_page_three = 10;
		const totalExpectedStyles_page_four = 8;

		await page.goto(astro.resolveUrl('/client-only-three'));
		let msg = page.locator('#name');
		await expect(msg).toHaveText('client-only-three');
		await page.waitForTimeout(400); // await hydration

		let styles = await page.locator('style').all();
		expect(styles.length).toEqual(totalExpectedStyles_page_three);

		await page.click('#click-four');

		let pageTwo = page.locator('#page-four');
		await expect(pageTwo, 'should have content').toHaveText('Page 4');

		styles = await page.locator('style').all();
		expect(styles.length).toEqual(totalExpectedStyles_page_four, 'style count has not changed');
	});

	test('Horizontal scroll position restored on back button', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/wide-page'));
		let article = page.locator('#widepage');
		await expect(article, 'should have script content').toBeVisible('exists');

		let locator = page.locator('#click-one');
		await expect(locator).not.toBeInViewport();

		await page.click('#click-right');
		locator = page.locator('#click-one');
		await expect(locator).toBeInViewport();
		locator = page.locator('#click-top');
		await expect(locator).toBeInViewport();

		await page.click('#click-one');
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		await page.goBack();
		locator = page.locator('#click-one');
		await expect(locator).toBeInViewport();

		locator = page.locator('#click-top');
		await expect(locator).toBeInViewport();

		await page.click('#click-top');
		locator = page.locator('#click-one');
		await expect(locator).not.toBeInViewport();
	});

	test('Use the client side router', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/six'));
		// page six loads the router and automatically uses the router to navigate to page 1
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// nudge to jump to page 2
		await page.evaluate(() => {
			window.dispatchEvent(new Event('jumpToTwo'));
		});
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');

		// jump to page 3
		await page.evaluate(() => {
			// get the router from its fixture park position
			const navigate = window.clientSideRouterForTestsParkedHere;
			navigate('/three');
		});
		p = page.locator('#three');
		await expect(p, 'should have content').toHaveText('Page 3');

		// go back
		await page.goBack();
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');

		// no bad things happen when we revisit redirecting to page 6
		await page.goto(astro.resolveUrl('/six'));
		p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');
	});

	test('Use the client side router in framework components', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/client-load'));

		// the button is set to naviagte() to /two
		const button = page.locator('#react-client-load-navigate-button');

		await expect(button, 'should have content').toHaveText('Navigate to `/two`');

		await button.click();

		const p = page.locator('#two');

		await expect(p, 'should have content').toHaveText('Page 2');
	});

	test('body inline scripts do not re-execute on navigation', async ({ page, astro }) => {
		const errors = [];
		page.addListener('pageerror', (err) => {
			errors.push(err);
		});

		await page.goto(astro.resolveUrl('/inline-script-one'));
		let article = page.locator('#counter');
		await expect(article, 'should have script content').toBeVisible('exists');

		await page.click('#click-one');

		article = page.locator('#counter');
		await expect(article, 'should have script content').toHaveText('Count: 3');

		expect(errors).toHaveLength(0);
	});

	test('replace history', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/one'));

		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// go to page 2
		await page.click('#click-two');
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');

		// replace with long page
		await page.click('#click-longpage');
		let article = page.locator('#longpage');
		await expect(article, 'should have script content').toBeVisible('exists');

		// one step back == #1
		await page.goBack();
		p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');
	});

	test('CSR replace history', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/six'));
		// page six loads the router and automatically uses the router to navigate to page 1
		let p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');

		// goto #2
		await page.evaluate(() => {
			window.clientSideRouterForTestsParkedHere('/two', { history: 'auto' });
		});
		p = page.locator('#two');
		await expect(p, 'should have content').toHaveText('Page 2');

		// replace with long page
		await page.evaluate(() => {
			window.clientSideRouterForTestsParkedHere('/long-page', { history: 'replace' });
		});
		let article = page.locator('#longpage');
		await expect(article, 'should have script content').toBeVisible('exists');

		// one step back == #1
		await page.goBack();
		p = page.locator('#one');
		await expect(p, 'should have content').toHaveText('Page 1');
	});

	test('Keep focus on transition', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/page-with-persistent-form'));
		let locator = page.locator('h2');
		await expect(locator, 'should have content').toHaveText('Form 1');

		locator = page.locator('#input');
		await locator.type('Hello');
		await expect(locator).toBeFocused();
		await locator.press('Enter');

		await page.waitForURL(/.*name=Hello/);
		locator = page.locator('h2');
		await expect(locator, 'should have content').toHaveText('Form 1');
		locator = page.locator('#input');
		await expect(locator).toBeFocused();

		await locator.type(' World');
		await expect(locator).toHaveValue('Hello World');
	});
});
