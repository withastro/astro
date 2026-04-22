import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { type Fixture, loadFixture } from './test-utils.js';

describe('CSP', () => {
	let fixture: Fixture;

	it('should generate hashes for inline styles', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
		});
		await fixture.build();
		const html = await fixture.readFile('/inline/index.html');
		const $ = cheerio.load(html);

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		// hash of the <style> content
		assert.ok(
			meta
				.attr('content')!
				.toString()
				.includes("'sha256-fP5hIETY85LoQH4mfn28a0KQgRZ3ZBI/WJOYJRKChes='"),
		);
	});

	it('should generate hashes and directives for fonts', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp-fonts/',
		});
		await fixture.build();
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		function parseCsp(csp: string): Array<{ directive: string; resources: Array<string> }> {
			return csp
				.split(';')
				.map((part) => part.trim())
				.filter((part) => part.length > 0)
				.map((part) => {
					const [directive, ...resources] = part.split(/\s+/);
					return {
						directive,
						resources,
					};
				});
		}

		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		const parsed = parseCsp(meta.attr('content')!.toString());
		assert.ok(
			parsed.find((e) => e.directive === 'style-src')?.resources.length === 2,
			'Style hash is not injected by vite-plugin-fonts',
		);
		assert.deepStrictEqual(parsed.find((e) => e.directive === 'font-src')?.resources, [
			"'self'",
			'https://fonts.cdn.test.com',
		]);
	});

	it('should generate hashes for Image component inline styles when using layout', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			outDir: './dist/csp-image',
		});
		await fixture.build();
		const html = await fixture.readFile('/image/index.html');
		const $ = cheerio.load(html);

		// Check that the image has data attributes instead of inline styles (CSP-compliant)
		const img = $('img');
		assert.ok(img.attr('data-astro-image'), 'Image should have data-astro-image attribute');
		assert.ok(img.attr('data-astro-image-fit'), 'Image should have data-astro-image-fit attribute');
		assert.ok(img.attr('data-astro-image-pos'), 'Image should have data-astro-image-pos attribute');

		// Check that the CSP meta tag contains a hash for the style
		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		const cspContent = meta.attr('content')!.toString();
		// The style-src directive should contain hashes (sha256- prefixed values)
		assert.ok(cspContent.includes('style-src'), 'CSP should have style-src directive');
		// There should be at least one sha256 hash for the static CSS
		const styleMatches = cspContent.match(/sha256-[A-Za-z0-9+/=]+/g);
		assert.ok(styleMatches && styleMatches.length > 0, 'CSP should contain style hashes');
	});

	it('should generate hashes for Picture component inline styles when using layout', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			outDir: './dist/csp-picture',
		});
		await fixture.build();
		const html = await fixture.readFile('/picture/index.html');
		const $ = cheerio.load(html);

		// Check that the img inside picture has data attributes instead of inline styles (CSP-compliant)
		const img = $('picture img');
		assert.ok(img.attr('data-astro-image'), 'Picture img should have data-astro-image attribute');
		assert.ok(
			img.attr('data-astro-image-fit'),
			'Picture img should have data-astro-image-fit attribute',
		);
		assert.ok(
			img.attr('data-astro-image-pos'),
			'Picture img should have data-astro-image-pos attribute',
		);

		// Check that the CSP meta tag contains a hash for the style
		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		const cspContent = meta.attr('content')!.toString();
		// The style-src directive should contain hashes (sha256- prefixed values)
		assert.ok(cspContent.includes('style-src'), 'CSP should have style-src directive');
		// There should be at least one sha256 hash for the static CSS
		const styleMatches = cspContent.match(/sha256-[A-Za-z0-9+/=]+/g);
		assert.ok(styleMatches && styleMatches.length > 0, 'CSP should contain style hashes');
	});

	it('should generate hashes for SVG component inline styles', async () => {
		fixture = await loadFixture({
			root: './fixtures/csp/',
			outDir: './dist/csp-svg',
		});
		await fixture.build();
		const html = await fixture.readFile('/svg/index.html');
		const $ = cheerio.load(html);

		// The SVG should be rendered inline with its <style> tag intact
		const svg = $('svg');
		assert.ok(svg.length > 0, 'SVG should be rendered inline');
		const svgStyle = $('svg style');
		assert.ok(svgStyle.length > 0, 'SVG should contain its <style> element');
		assert.ok(
			svgStyle.text().includes('.square{fill: red}'),
			'SVG style should have original content',
		);

		// The style should NOT be duplicated in the <head> — it stays inside the <svg>
		const headStyles = $('head style');
		const headHasSvgStyle = headStyles
			.toArray()
			.some((el) => $(el).text().includes('.square{fill: red}'));
		assert.ok(!headHasSvgStyle, 'SVG style should not be duplicated in <head>');

		// The CSP meta tag should contain a hash for the SVG's inline style
		const meta = $('meta[http-equiv="Content-Security-Policy"]');
		const cspContent = meta.attr('content')!.toString();
		assert.ok(cspContent.includes('style-src'), 'CSP should have style-src directive');
		// sha256 hash of ".square{fill: red}"
		assert.ok(
			cspContent.includes("'sha256-TFjYo91aZcH4Kex6qdJUFz/POAVYu5H/OgkpRfHpLfw='"),
			'CSP should contain the hash of the SVG inline style',
		);
	});

	it('should return CSP header inside a hook', async () => {
		let routeToHeaders: Map<string, { headers: Headers }> | undefined;
		fixture = await loadFixture({
			root: './fixtures/csp-adapter/',
			outDir: './dist/csp-hook',
			adapter: testAdapter({
				staticHeaders: true,
				setRouteToHeaders(payload: Map<string, { headers: Headers }>) {
					routeToHeaders = payload;
				},
			}),
			security: {
				csp: true,
			},
		});
		await fixture.build();
		await fixture.loadTestAdapterApp();

		assert.equal(routeToHeaders!.size, 4, 'expected four routes: /, /scripts, /foo, /bar');

		assert.ok(routeToHeaders!.has('/'), 'should have a CSP header for /');
		assert.ok(routeToHeaders!.has('/scripts'), 'should have a CSP header for /scripts');
		assert.ok(routeToHeaders!.has('/foo'), 'should have a CSP header for /foo');
		assert.ok(routeToHeaders!.has('/bar'), 'should have a CSP header for /bar');

		for (const { headers } of routeToHeaders!.values()) {
			assert.ok(headers.has('content-security-policy'), 'should have a CSP header');
		}
	});
});
