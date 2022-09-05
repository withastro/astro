import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { isWindows, loadFixture } from './test-utils.js';

describe('Special chars in component import paths', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	const componentIds = [
		'caret',
		'rocket',
		// Not supported as import identifier in Vite
		// 'percent',
		'space',
		'round-bracket',
		'square-bracket',
	];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/special-chars-in-component-imports/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Build succeeds', async () => {
			const html = await fixture.readFile('/index.html');
			expect(html).to.contain('<html>');
		});

		it('Special chars in imports work from .astro files', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			// Test 1: Correct page
			expect($('h1').text()).to.contain('.astro');

			// Test 2: All components exist
			componentIds.forEach((componentId) => {
				expect($(`#${componentId}`), `Component #${componentId} does not exist`).to.have.lengthOf(
					1
				);
			});

			// Test 3: Component contents were rendered properly
			componentIds.forEach((componentId) => {
				expect($(`#${componentId} > div`).text()).to.equal(`${componentId}: 0`);
			});

			// Test 4: There is an island for each component
			expect($('astro-island[uid]')).to.have.lengthOf(componentIds.length);
		});

		it('Special chars in imports work from .mdx files', async () => {
			const html = await fixture.readFile('/mdx/index.html');
			const $ = cheerioLoad(html);

			// Test 1: Correct page
			expect($('h1').text()).to.contain('.mdx');

			// Test 2: All components exist
			componentIds.forEach((componentId) => {
				expect($(`#${componentId}`), `Component #${componentId} does not exist`).to.have.lengthOf(
					1
				);
			});

			// Test 3: Component contents were rendered properly
			componentIds.forEach((componentId) => {
				expect($(`#${componentId} > div`).text()).to.equal(`${componentId}: 0`);
			});

			// Test 4: There is an island for each component
			expect($('astro-island[uid]')).to.have.lengthOf(componentIds.length);
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

		it('Special chars in imports work from .astro files', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			// Test 1: Correct page
			expect($('h1').text()).to.contain('.astro');

			// Test 2: All components exist
			componentIds.forEach((componentId) => {
				expect($(`#${componentId}`), `Component #${componentId} does not exist`).to.have.lengthOf(
					1
				);
			});

			// Test 3: Component contents were rendered properly
			componentIds.forEach((componentId) => {
				expect($(`#${componentId} > div`).text()).to.equal(`${componentId}: 0`);
			});

			// Test 4: There is an island for each component
			expect($('astro-island[uid]')).to.have.lengthOf(componentIds.length);
		});

		it('Special chars in imports work from .mdx files', async () => {
			const html = await fixture.fetch('/mdx').then((res) => res.text());
			const $ = cheerioLoad(html);

			// Test 1: Correct page
			expect($('h1').text()).to.contain('.mdx');

			// Test 2: All components exist
			componentIds.forEach((componentId) => {
				expect($(`#${componentId}`), `Component #${componentId} does not exist`).to.have.lengthOf(
					1
				);
			});

			// Test 3: Component contents were rendered properly
			componentIds.forEach((componentId) => {
				expect($(`#${componentId} > div`).text()).to.equal(`${componentId}: 0`);
			});

			// Test 4: There is an island for each component
			expect($('astro-island[uid]')).to.have.lengthOf(componentIds.length);
		});
	});
});
