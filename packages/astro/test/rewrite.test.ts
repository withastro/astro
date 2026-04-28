import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Dev rewrite, trailing slash -> never', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/rewrite-trailing-slash-never/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should rewrite to the homepage', async () => {
		const html = await fixture.fetch('/foo').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});
});

describe('Dev rewrite, trailing slash -> never, with base', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/rewrite-trailing-slash-never/',
			base: 'base',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should rewrite to the homepage', async () => {
		const html = await fixture.fetch('/base/foo').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
		assert.equal($('p').text(), '/base');
	});

	it('should rewrite and always include base', async () => {
		//rewrite('/') will rewrite to '/base'
		const html = await fixture.fetch('/base/bar').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
		assert.equal($('p').text(), '/base');
	});
});

describe('Dev rewrite, hybrid/server', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/rewrite-server/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should rewrite the [slug]/title ', async () => {
		const html = await fixture.fetch('/').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.match($('h1').text(), /Title/);
		assert.match($('p').text(), /some-slug/);
	});

	it('should display an error if a rewrite is attempted after the body has been consumed', async () => {
		const formData = new FormData();
		formData.append('email', 'example@example.com');

		const request = new Request('http://example.com/post/post-body-used', {
			method: 'POST',
			body: formData,
		});
		const response = await fixture.fetch('/post/post-body-used', request);
		const html = await response.text();
		const $ = cheerioLoad(html);

		assert.equal($('title').text(), 'RewriteWithBodyUsed');
	});

	it('should error when rewriting from a SSR route to a SSG route', async () => {
		const html = await fixture.fetch('/forbidden/dynamic').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.match($('title').text(), /ForbiddenRewrite/);
	});
});

describe('Dev rewrite URL contains base and has no trailing slash', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/rewrite-with-base/',
			trailingSlash: 'never',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should rewrite to homepage & url contains base', async () => {
		const html = await fixture.fetch('/base/rewrite-to-index').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
		assert.equal($('p').text(), '/base');
	});

	it('should rewrite to homepage & url contains base when base is in the rewrite call', async () => {
		const html = await fixture.fetch('/base/rewrite-with-base-to-index').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
		assert.equal($('p').text(), '/base');
	});

	it('should rewrite to subpage & url contains base', async () => {
		const html = await fixture.fetch('/base/rewrite-to-subpage').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Page');
		assert.equal($('p').text(), '/base/page');
	});

	it('should rewrite to page & url contains base when base is in the rewrite call', async () => {
		const html = await fixture
			.fetch('/base/rewrite-with-base-to-subpage')
			.then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Page');
		assert.equal($('p').text(), '/base/page');
	});
});
describe('SSR route', () => {
	it("should not build if a user tries to use rewrite('/404') in static pages", async () => {
		try {
			const fixture = await loadFixture({
				root: './fixtures/rewrite-404-invalid/',
			});
			await fixture.build();
			assert.fail('It should fail.');
		} catch {
			// it passes
			assert.equal(true, true);
		}
	});
});

describe('Runtime error, default 500', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/rewrite-runtime-error/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should return a 500 status code, but not render the custom 500', async () => {
		const response = await fixture.fetch('/errors/from');
		assert.equal(response.status, 500);
		const text = await response.text();
		assert.match(text, /@vite\/client/);
	});
});

describe('Runtime error in dev, custom 500', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/rewrite-runtime-error-custom500/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should render the custom 500 when rewriting a page that throws an error', async () => {
		const response = await fixture.fetch('/errors/start');
		assert.equal(response.status, 500);
		const html = await response.text();
		assert.match(html, /I am the custom 500/);
	});
});
