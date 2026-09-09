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
				outDir: './dist/minification-html-in-dev-environment/',
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
				outDir: './dist/minification-html-build-ssg/',
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
				outDir: './dist/minification-html-build-ssr/',
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

describe('HTML minification (default)', () => {
	let html: string;
	before(async () => {
		// This fixture intentionally leaves `compressHTML` unset to exercise the default.
		const fixture = await loadFixture({
			root: './fixtures/minification-html-default/',
			build: { inlineStylesheets: 'never' },
			outDir: './dist/minification-html-default/',
		});
		await fixture.build();
		html = await fixture.readFile('/index.html');
	});

	it('strips whitespace between inline elements, following JSX rules', () => {
		// The discriminator: HTML-aware compression (`true`) keeps a single space
		// here, while the default JSX rules remove it entirely.
		assert.ok(
			html.includes('<span>hello</span><em>world</em>'),
			'whitespace between inline elements should be removed',
		);
	});

	it('collapses multi-line text into a single line', () => {
		assert.ok(html.includes('<p id="multi-line">Hello world</p>'));
	});

	it('preserves whitespace inside <pre> tags', () => {
		assert.match(html, /<pre id="preserved">\n\s+keep\n\s+this\n\s+whitespace/);
	});

	it('removes every newline outside of <pre>', () => {
		const withoutPre = html.replace(/<pre[\s\S]*?<\/pre>/g, '');
		assert.equal(NEW_LINES.test(withoutPre), false);
	});
});

describe('HTML minification (compressHTML: true differs from the default)', () => {
	it('keeps a single space between inline elements', async () => {
		const fixture = await loadFixture({
			root: './fixtures/minification-html-default/',
			build: { inlineStylesheets: 'never' },
			outDir: './dist/minification-html-true/',
			compressHTML: true,
		});
		await fixture.build();
		const html = await fixture.readFile('/index.html');
		assert.ok(
			html.includes('<span>hello</span> <em>world</em>'),
			'HTML-aware compression should preserve inline whitespace as a single space',
		);
	});
});
