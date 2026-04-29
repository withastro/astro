import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

const NEW_LINES = /[\r\n]+/g;

/**
 * The doctype declaration is on a line between the rest of the HTML in SSG.
 * This function removes the doctype so that we can check if the rest of the HTML is without
 * whitespace.
 */
function removeDoctypeLine(html: string) {
	return html.slice(20);
}

/**
 * In the dev environment, two more script tags will be injected than in the production environment
 * so that we can check if the rest of the HTML is without whitespace
 */
function removeDoctypeLineInDev(html: string) {
	return html.slice(-100);
}

describe('HTML minification', () => {
	describe('in DEV environment', () => {
		let fixture: Fixture;
		let devServer: DevServer;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/minification-html/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should emit compressed HTML in the emitted file', async () => {
			let res = await fixture.fetch('/');
			assert.equal(res.status, 200);
			const html = await res.text();
			assert.equal(NEW_LINES.test(removeDoctypeLineInDev(html)), false);
		});
	});

	describe('Build SSG', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/minification-html/',
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
			});
			await fixture.build();
		});

		it('should emit compressed HTML in the emitted file', async () => {
			const html = await fixture.readFile('/index.html');
			assert.equal(NEW_LINES.test(html), false);
		});
	});

	describe('Build SSR', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/minification-html/',
				output: 'server',
				adapter: testAdapter(),
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
			});
			await fixture.build();
		});

		it('should emit compressed HTML in the emitted file', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			assert.equal(NEW_LINES.test(removeDoctypeLine(html)), false);
		});
	});
});

describe('HTML minification (JSX mode)', () => {
	describe('Build SSG', () => {
		let fixture: Fixture;
		let html: string;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/minification-html-jsx/',
				build: { inlineStylesheets: 'never' },
			});
			await fixture.build();
			html = await fixture.readFile('/index.html');
		});

		it('should strip indentation from multi-line text', () => {
			// JSX whitespace stripping should collapse multi-line indented children
			// into a single line with spaces between words
			assert.ok(html.includes('Hello world'), 'multi-line text should be joined with a space');
			assert.ok(!html.includes('\n        Hello'), 'leading indentation should be stripped');
		});

		it('should preserve whitespace inside <pre> tags', () => {
			assert.ok(html.includes('<pre id="preserved">'), '<pre> tag should be present');
			// The <pre> content should retain its internal whitespace
			assert.match(html, /keep\n\s+this\n\s+whitespace/);
		});

		it('should preserve inline text and elements on the same line', () => {
			assert.ok(
				html.includes('<span>hello</span> <em>world</em>'),
				'inline elements should preserve spacing',
			);
		});
	});
});
