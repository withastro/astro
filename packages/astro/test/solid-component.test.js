import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { isWindows, loadFixture } from './test-utils.js';

describe('Solid component', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/solid-component/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can load a component', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// test 1: Works
			expect($('.hello')).to.have.lengthOf(1);

			// test 2: Support rendering proxy components
			expect($('#proxy-component').text()).to.be.equal('Hello world');
		});

		// ssr-client-none.astro
		it('Supports server only components', async () => {
			const html = await fixture.readFile('ssr-client-none/index.html');
			const hydrationScriptCount = countHydrationScripts(html);
			expect(hydrationScriptCount).to.be.equal(0);
			const hydrationEventsCount = countHydrationEvents(html);
			expect(hydrationEventsCount).to.be.equal(0);
		});

		it('Supports lazy server only components', async () => {
			const html = await fixture.readFile('ssr-client-none/index.html');
			const $ = cheerio.load(html);
			// AsyncComponent renders 1 button
			// LazyCounter renders 4 buttons
			// Total is 5 buttons
			expect($('button')).to.have.lengthOf(5);
		});

		// ssr-client-none-throwing.astro
		it('Supports server only components with error boundaries', async () => {
			const html = await fixture.readFile('ssr-client-none-throwing/index.html');
			const hydrationScriptCount = countHydrationScripts(html);
			expect(hydrationScriptCount).to.be.equal(0);
			expect(html).to.include('Async error boundary fallback');
			expect(html).to.include('Sync error boundary fallback');
			const hydrationEventsCount = countHydrationEvents(html);
			expect(hydrationEventsCount).to.be.equal(0);
		});

		// ssr-client-load.astro
		it('Supports hydrating components', async () => {
			const html = await fixture.readFile('ssr-client-load/index.html');
			const hydrationScriptCount = countHydrationScripts(html);
			expect(hydrationScriptCount).to.be.equal(1);
		});

		it('Supports lazy hydrating components', async () => {
			const html = await fixture.readFile('ssr-client-load/index.html');
			const $ = cheerio.load(html);
			// AsyncComponent renders 1 button, and there are 2 AsyncComponents
			// LazyCounter renders 4 buttons
			// Total is 6 buttons
			expect($('button')).to.have.lengthOf(6);
		});

		// ssr-client-load-throwing.astro
		it('Supports hydrating components with error boundaries', async () => {
			const html = await fixture.readFile('ssr-client-load-throwing/index.html');
			const hydrationScriptCount = countHydrationScripts(html);
			expect(hydrationScriptCount).to.be.equal(1);
			expect(html).to.include('Async error boundary fallback');
			expect(html).to.include('Sync error boundary fallback');
			const hydrationEventsCount = countHydrationEvents(html);
			expect(hydrationEventsCount).to.be.greaterThanOrEqual(1);
		});

		// ssr-client-only.astro
		it('Supports client only components', async () => {
			const html = await fixture.readFile('ssr-client-only/index.html');
			const hydrationScriptCount = countHydrationScripts(html);
			expect(hydrationScriptCount).to.be.equal(0);
		});

		// nested.astro

		it('Injects hydration script before any SolidJS components in the HTML, even if heavily nested', async () => {
			// TODO: This tests SSG mode, where the extraHead is generally available.
			// Should add a test (and solution) for SSR mode, where head is more likely to have already
			// been streamed to the client.
			const html = await fixture.readFile('nested/index.html');

			const firstHydrationScriptAt = getFirstHydrationScriptLocation(html);
			expect(firstHydrationScriptAt).to.be.finite.and.greaterThan(0);

			const firstHydrationEventAt = getFirstHydrationEventLocation(html);
			expect(firstHydrationEventAt).to.be.finite.and.greaterThan(0);

			expect(firstHydrationScriptAt).to.be.lessThan(
				firstHydrationEventAt,
				'Position of first hydration event'
			);
		});

		it('Injects hydration script before any SolidJS components in the HTML, even if render order is reversed by delay', async () => {
			const html = await fixture.readFile('deferred/index.html');

			const firstHydrationScriptAt = getFirstHydrationScriptLocation(html);
			expect(firstHydrationScriptAt).to.be.finite.and.greaterThan(0);

			const firstHydrationEventAt = getFirstHydrationEventLocation(html);
			expect(firstHydrationEventAt).to.be.finite.and.greaterThan(0);

			const hydrationScriptCount = countHydrationScripts(html);
			expect(hydrationScriptCount).to.be.equal(1);
			expect(firstHydrationScriptAt).to.be.lessThan(
				firstHydrationEventAt,
				'Position of first hydration event'
			);
		});
	});

	if (isWindows) return;

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Can load a component', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			// test 1: Works
			expect($('.hello')).to.have.lengthOf(1);

			// test 2: Support rendering proxy components
			expect($('#proxy-component').text()).to.be.equal('Hello world');
		});

		it('scripts proxy correctly', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			for (const script of $('script').toArray()) {
				const { src } = script.attribs;
				if (!src) continue;
				expect((await fixture.fetch(src)).status, `404: ${src}`).to.equal(200);
			}
		});
	});
});

/**
 * Get a regex that matches hydration scripts.
 *
 * Based on this hydration script:
 * https://github.com/ryansolid/dom-expressions/blob/main/packages/dom-expressions/assets/hydrationScripts.js
 *
 * Which is supposed to be injected in a page with hydrating Solid components
 * essentially one time.
 *
 * We look for the hint "_$HY=".
 *
 * I chose to make this a function to avoid accidentally sharing regex state
 * between tests.
 *
 * NOTE: These scripts have ocassionally changed in the past. If the tests
 * start failing after a Solid version change, we may need to find a different
 * way to count the hydration scripts.
 */
const createHydrationScriptRegex = (flags) => new RegExp(/_\$HY=/, flags);

function countHydrationScripts(/** @type {string} */ html) {
	return html.match(createHydrationScriptRegex('g'))?.length ?? 0;
}

function getFirstHydrationScriptLocation(/** @type {string} */ html) {
	return html.match(createHydrationScriptRegex())?.index;
}

/**
 * Get a regex that matches hydration events. A hydration event
 * is when data is emitted to help hydrate a component during SSR process.
 *
 * We look for the hint "_$HY.r["
 */
const createHydrationEventRegex = (flags) => new RegExp(/_\$HY.r\[/, flags);

function countHydrationEvents(/** @type {string} */ html) {
	// Number of times a component was hydrated during rendering
	// We look for the hint "_$HY.r["

	return html.match(createHydrationEventRegex('g'))?.length ?? 0;
}

function getFirstHydrationEventLocation(/** @type {string} */ html) {
	return html.match(createHydrationEventRegex())?.index;
}
