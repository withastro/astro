import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { RenderContext } from '../../../dist/core/render-context.js';
import {
	createComponent,
	maybeRenderHead,
	render,
	renderHead,
} from '../../../dist/runtime/server/index.js';
import { createBasicPipeline } from '../test-utils.js';

// #region Test Utilities

/**
 * Creates a pipeline with CSP configuration
 * @param {Partial<import('../../../dist/core/app/types.js').SSRManifestCSP>} cspConfig
 */
function createCspPipeline(cspConfig = {}) {
	const pipeline = createBasicPipeline();
	pipeline.manifest = {
		...pipeline.manifest,
		shouldInjectCspMetaTags: true,
		csp: {
			cspDestination: cspConfig.cspDestination,
			algorithm: cspConfig.algorithm || 'SHA-256',
			scriptHashes: cspConfig.scriptHashes || [],
			scriptResources: cspConfig.scriptResources || [],
			styleHashes: cspConfig.styleHashes || [],
			styleResources: cspConfig.styleResources || [],
			directives: cspConfig.directives || [],
			isStrictDynamic: cspConfig.isStrictDynamic || false,
		},
	};
	return pipeline;
}

/**
 * Renders a page component and returns HTML and headers
 * @param {any} PageComponent
 * @param {any} pipeline
 * @param {boolean} prerender
 */
async function renderPage(PageComponent, pipeline, prerender = true) {
	const PageModule = { default: PageComponent };
	const request = new Request('http://localhost/');
	const routeData = {
		type: 'page',
		pathname: '/index',
		component: 'src/pages/index.astro',
		params: {},
		prerender,
	};

	const renderContext = await RenderContext.create({ pipeline, request, routeData });
	const response = await renderContext.render(PageModule);
	const html = await response.text();

	return { html, response };
}

// #endregion

// #region Reusable Components

/** Simple page component */
const SimplePage = createComponent((result) => {
	return render`<html>
		<head>${renderHead(result)}</head>
		<body>${maybeRenderHead(result)}<h1>Test</h1></body>
	</html>`;
});

// #endregion

// #region Tests

describe('CSP Rendering', () => {
	describe('Style Hashes', () => {
		it('should contain style hashes in meta tag when CSS is imported', async () => {
			const pipeline = createCspPipeline({
				styleHashes: ['sha256-abc123', 'sha256-def456'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			assert.ok(content.includes('sha256-abc123'), 'Should include first style hash');
			assert.ok(content.includes('sha256-def456'), 'Should include second style hash');
			assert.ok(content.includes('style-src'), 'Should have style-src directive');
		});

		// Note: Inline style hashing requires the full build pipeline
		// and cannot be easily unit tested. This is tested in integration tests.
	});

	describe('Script Hashes', () => {
		it('should contain script hashes in meta tag when using client islands', async () => {
			const pipeline = createCspPipeline({
				scriptHashes: ['sha256-xyz789', 'sha256-uvw456'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			assert.ok(content.includes('sha256-xyz789'), 'Should include first script hash');
			assert.ok(content.includes('sha256-uvw456'), 'Should include second script hash');
			assert.ok(content.includes('script-src'), 'Should have script-src directive');
		});
	});

	describe('Hash Algorithms', () => {
		it('should generate hashes with SHA-512 algorithm', async () => {
			const pipeline = createCspPipeline({
				algorithm: 'SHA-512',
				scriptHashes: ['sha512-longhash123abc'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			assert.ok(content.includes('sha512-'), 'Should use sha512 prefix');
			assert.ok(content.includes('sha512-longhash123abc'), 'Should include SHA-512 hash');
		});

		it('should generate hashes with SHA-384 algorithm', async () => {
			const pipeline = createCspPipeline({
				algorithm: 'SHA-384',
				scriptHashes: ['sha384-mediumhash456'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			assert.ok(content.includes('sha384-'), 'Should use sha384 prefix');
			assert.ok(content.includes('sha384-mediumhash456'), 'Should include SHA-384 hash');
		});
	});

	describe('Custom Hashes', () => {
		it('should render user-provided hashes', async () => {
			const pipeline = createCspPipeline({
				styleHashes: ['sha512-hash1', 'sha384-hash2'],
				scriptHashes: ['sha512-hash3', 'sha384-hash4'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			assert.ok(content.includes('sha384-hash2'), 'Should include custom style hash 1');
			assert.ok(content.includes('sha384-hash4'), 'Should include custom script hash 1');
			assert.ok(content.includes('sha512-hash1'), 'Should include custom style hash 2');
			assert.ok(content.includes('sha512-hash3'), 'Should include custom script hash 2');
		});
	});

	describe('Additional Directives', () => {
		it('should include additional directives', async () => {
			const pipeline = createCspPipeline({
				directives: ["img-src 'self' 'https://example.com'"],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			assert.ok(
				content.includes("img-src 'self' 'https://example.com'"),
				'Should include custom directive',
			);
		});

		it('should handle directives that do not require values', async () => {
			const pipeline = createCspPipeline({
				directives: [
					'upgrade-insecure-requests',
					'sandbox',
					'trusted-types',
					'report-uri https://endpoint.example.com',
				],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			assert.ok(content.includes('upgrade-insecure-requests'), 'Should include upgrade directive');
			assert.ok(content.includes('sandbox'), 'Should include sandbox directive');
			assert.ok(content.includes('trusted-types'), 'Should include trusted-types directive');
			assert.ok(
				content.includes('report-uri https://endpoint.example.com'),
				'Should include report-uri directive',
			);
		});
	});

	describe('Custom Resources', () => {
		it('should include custom resources for script-src and style-src', async () => {
			const pipeline = createCspPipeline({
				styleResources: ['https://cdn.example.com', 'https://styles.cdn.example.com'],
				scriptResources: ['https://cdn.example.com', 'https://scripts.cdn.example.com'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			assert.ok(
				content.includes('script-src https://cdn.example.com https://scripts.cdn.example.com'),
				'Should include script resources',
			);
			assert.ok(
				content.includes('style-src https://cdn.example.com https://styles.cdn.example.com'),
				'Should include style resources',
			);
		});
	});

	describe('Runtime CSP API - Astro.csp', () => {
		it('should allow injecting custom script resources and hashes via Astro.csp', async () => {
			const pipeline = createCspPipeline({
				directives: ["img-src 'self'"],
				scriptResources: ['https://global.cdn.example.com'],
			});

			const PageWithCspApi = createComponent((result) => {
				const Astro = result.createAstro({}, {});

				// Use runtime CSP API
				Astro.csp.insertScriptResource('https://scripts.cdn.example.com');
				Astro.csp.insertScriptHash('sha256-customHash');
				Astro.csp.insertDirective("default-src 'self'");
				Astro.csp.insertDirective('img-src https://images.cdn.example.com');

				return render`<html>
					<head>${renderHead(result)}</head>
					<body>${maybeRenderHead(result)}<h1>Scripts</h1></body>
				</html>`;
			});

			const { html } = await renderPage(PageWithCspApi, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			// Check resources are merged and deduplicated
			assert.ok(
				content.includes(
					'script-src https://global.cdn.example.com https://scripts.cdn.example.com',
				),
				'Should merge script resources',
			);
			assert.ok(content.includes("style-src 'self'"), 'Should have default style-src');

			// Check hashes
			assert.ok(content.includes('sha256-customHash'), 'Should include custom hash');

			// Check directives are merged
			assert.ok(content.includes("default-src 'self'"), 'Should include default-src');
			assert.ok(
				content.includes("img-src 'self' https://images.cdn.example.com"),
				'Should merge img-src directives',
			);
		});

		it('should allow injecting custom style resources and hashes via Astro.csp', async () => {
			const pipeline = createCspPipeline({
				directives: ["img-src 'self'"],
				styleResources: ['https://global.cdn.example.com'],
			});

			const PageWithStyleApi = createComponent((result) => {
				const Astro = result.createAstro({}, {});

				// Use runtime CSP API for styles
				Astro.csp.insertStyleResource('https://styles.cdn.example.com');
				Astro.csp.insertStyleHash('sha256-customStyleHash');
				Astro.csp.insertDirective("default-src 'self'");
				Astro.csp.insertDirective('img-src https://images.cdn.example.com');

				return render`<html>
					<head>${renderHead(result)}</head>
					<body>${maybeRenderHead(result)}<h1>Styles</h1></body>
				</html>`;
			});

			const { html } = await renderPage(PageWithStyleApi, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			// Check style resources are merged
			assert.ok(
				content.includes('style-src https://global.cdn.example.com https://styles.cdn.example.com'),
				'Should merge style resources',
			);
			assert.ok(content.includes("script-src 'self'"), 'Should have default script-src');

			// Check hashes
			assert.ok(content.includes('sha256-customStyleHash'), 'Should include custom style hash');

			// Check directives are merged
			assert.ok(content.includes("default-src 'self'"), 'Should include default-src');
			assert.ok(
				content.includes("img-src 'self' https://images.cdn.example.com"),
				'Should merge img-src directives',
			);
		});
	});

	describe('Strict Dynamic', () => {
		it("should add 'strict-dynamic' when enabled", async () => {
			const pipeline = createCspPipeline({
				isStrictDynamic: true,
				scriptHashes: ['sha256-test123'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			assert.ok(content.includes("'strict-dynamic'"), "Should include 'strict-dynamic' keyword");
		});
	});

	describe('CSP Delivery Methods', () => {
		it('should serve CSP via meta tag for prerendered pages (default)', async () => {
			const pipeline = createCspPipeline({
				styleHashes: ['sha256-test123'],
			});

			const { html, response } = await renderPage(SimplePage, pipeline, true);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			assert.ok(meta.length > 0, 'Should have CSP meta tag');
			assert.equal(
				response.headers.get('content-security-policy'),
				null,
				'Should not have CSP header',
			);
		});

		it('should serve CSP via headers for SSR/dynamic pages', async () => {
			const pipeline = createCspPipeline({
				cspDestination: 'header',
				styleHashes: ['sha256-test123'],
				styleResources: ['https://styles.cdn.example.com'],
			});

			const { html, response } = await renderPage(SimplePage, pipeline, false);
			const $ = cheerio.load(html);

			const header = response.headers.get('content-security-policy');
			assert.ok(header, 'Should have CSP header');
			assert.ok(header.includes('style-src'), 'Header should include style-src');
			assert.ok(
				header.includes('https://styles.cdn.example.com'),
				'Header should include style resources',
			);
			assert.ok(header.includes("script-src 'self'"), 'Header should include script-src');
			assert.ok(header.includes('sha256-test123'), 'Header should include hash');

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			assert.equal(meta.attr('content'), undefined, 'Should not have CSP meta tag');
		});
	});

	describe('Font Source Directive', () => {
		it('should not inject font-src by default when fonts are not used', async () => {
			const pipeline = createCspPipeline({
				scriptHashes: ['sha256-test123'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			assert.equal(content.includes('font-src'), false, 'Should not include font-src directive');
		});
	});

	describe('CSP Content Parsing', () => {
		it('should generate well-formed CSP content', async () => {
			const pipeline = createCspPipeline({
				directives: ["img-src 'self'", "default-src 'none'"],
				scriptHashes: ['sha256-abc123'],
				scriptResources: ['https://cdn.example.com'],
				styleHashes: ['sha256-def456'],
				styleResources: ['https://styles.example.com'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content');

			// Parse CSP content into structured array
			const parsed = content
				.split(';')
				.map((part) => part.trim())
				.filter((part) => part.length > 0)
				.map((part) => {
					const [directive, ...resources] = part.split(/\s+/);
					return { directive, resources };
				});

			// Check that all directives are present
			const directives = parsed.map((p) => p.directive);
			assert.ok(directives.includes('img-src'), 'Should have img-src');
			assert.ok(directives.includes('default-src'), 'Should have default-src');
			assert.ok(directives.includes('script-src'), 'Should have script-src');
			assert.ok(directives.includes('style-src'), 'Should have style-src');

			// Check script-src has both resources and hashes
			const scriptSrc = parsed.find((p) => p.directive === 'script-src');
			assert.ok(
				scriptSrc.resources.includes('https://cdn.example.com'),
				'script-src should include resource',
			);
			assert.ok(
				scriptSrc.resources.some((r) => r.includes('sha256-abc123')),
				'script-src should include hash',
			);

			// Check style-src has both resources and hashes
			const styleSrc = parsed.find((p) => p.directive === 'style-src');
			assert.ok(
				styleSrc.resources.includes('https://styles.example.com'),
				'style-src should include resource',
			);
			assert.ok(
				styleSrc.resources.some((r) => r.includes('sha256-def456')),
				'style-src should include hash',
			);
		});
	});
});

// #endregion
