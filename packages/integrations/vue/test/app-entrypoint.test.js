import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { parseHTML } from 'linkedom';

describe('App Entrypoint', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/app-entrypoint/',
		});
		await fixture.build();
	});

	it('loads during SSR', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		// test 1: basic component renders
		expect($('#foo > #bar').text()).to.eq('works');

		// test 2: component with multiple script blocks renders and exports
		// values from non setup block correctly
		expect($('#multiple-script-blocks').text()).to.equal('2 4');

		// test 3: component using generics renders
		expect($('#generics').text()).to.equal('generic');

		// test 4: component using generics and multiple script blocks renders
		expect($('#generics-and-blocks').text()).to.equal('1 3!!!');
	});

	it('setup included in renderer bundle', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const island = document.querySelector('astro-island');
		const client = island.getAttribute('renderer-url');
		expect(client).not.to.be.undefined;

		const js = await fixture.readFile(client);
		expect(js).to.match(/\w+\.component\(\"Bar\"/gm);
	});

	it('loads svg components without transforming them to assets', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const client = document.querySelector('astro-island svg');

		expect(client).not.to.be.undefined;
	});
});

describe('App Entrypoint no export default (dev)', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/app-entrypoint-no-export-default/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('loads during SSR', async () => {
		const html = await fixture.fetch('/').then((res) => res.text());
		const { document } = parseHTML(html);
		const bar = document.querySelector('#foo > #bar');
		expect(bar).not.to.be.undefined;
		expect(bar.textContent).to.eq('works');
	});

	it('loads svg components without transforming them to assets', async () => {
		const html = await fixture.fetch('/').then((res) => res.text());
		const { document } = parseHTML(html);
		const client = document.querySelector('astro-island svg');

		expect(client).not.to.be.undefined;
	});
});

describe('App Entrypoint no export default', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/app-entrypoint-no-export-default/',
		});
		await fixture.build();
	});

	it('loads during SSR', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const bar = document.querySelector('#foo > #bar');
		expect(bar).not.to.be.undefined;
		expect(bar.textContent).to.eq('works');
	});

	it('component not included in renderer bundle', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const island = document.querySelector('astro-island');
		const client = island.getAttribute('renderer-url');
		expect(client).not.to.be.undefined;

		const js = await fixture.readFile(client);
		expect(js).not.to.match(/\w+\.component\(\"Bar\"/gm);
	});

	it('loads svg components without transforming them to assets', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const client = document.querySelector('astro-island svg');

		expect(client).not.to.be.undefined;
	});
});

describe('App Entrypoint relative', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/app-entrypoint-relative/',
		});
		await fixture.build();
	});

	it('loads during SSR', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const bar = document.querySelector('#foo > #bar');
		expect(bar).not.to.be.undefined;
		expect(bar.textContent).to.eq('works');
	});

	it('component not included in renderer bundle', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const island = document.querySelector('astro-island');
		const client = island.getAttribute('renderer-url');
		expect(client).not.to.be.undefined;

		const js = await fixture.readFile(client);
		expect(js).not.to.match(/\w+\.component\(\"Bar\"/gm);
	});
});

describe('App Entrypoint /src/absolute', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/app-entrypoint-src-absolute/',
		});
		await fixture.build();
	});

	it('loads during SSR', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const bar = document.querySelector('#foo > #bar');
		expect(bar).not.to.be.undefined;
		expect(bar.textContent).to.eq('works');
	});

	it('component not included in renderer bundle', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const island = document.querySelector('astro-island');
		const client = island.getAttribute('renderer-url');
		expect(client).not.to.be.undefined;

		const js = await fixture.readFile(client);
		expect(js).not.to.match(/\w+\.component\(\"Bar\"/gm);
	});
});
