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
function createCspPipeline(cspConfig = {}, { experimentalCSPLevel3 = false } = {}) {
	const pipeline = createBasicPipeline();
	pipeline.manifest = {
		...pipeline.manifest,
		shouldInjectCspMetaTags: true,
		experimentalCSPLevel3,
		csp: {
			cspDestination: cspConfig.cspDestination,
			algorithm: cspConfig.algorithm || 'SHA-256',
			scriptHashes: cspConfig.scriptHashes || [],
			scriptResources: cspConfig.scriptResources || [],
			styleHashes: cspConfig.styleHashes || [],
			styleResources: cspConfig.styleResources || [],
			scriptElemHashes: cspConfig.scriptElemHashes || [],
			scriptElemResources: cspConfig.scriptElemResources || [],
			styleElemHashes: cspConfig.styleElemHashes || [],
			styleElemResources: cspConfig.styleElemResources || [],
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

/**
 * Parse a CSP string into a Map of directive-name → values[].
 * E.g. "script-src 'self' 'sha256-abc'; style-src 'self';"
 *   → Map { "script-src" => ["'self'", "'sha256-abc'"], "style-src" => ["'self'"] }
 */
function parseCsp(cspString) {
	const map = new Map();
	for (const part of cspString.split(';')) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const [name, ...values] = trimmed.split(/\s+/);
		map.set(name, values);
	}
	return map;
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
		it('should contain style hashes in style-src directive', async () => {
			const pipeline = createCspPipeline({
				styleHashes: ['sha256-abc123', 'sha256-def456'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const csp = parseCsp(meta.attr('content'));

			assert.ok(csp.has('style-src'), 'Should have style-src directive');
			const styleSrc = csp.get('style-src');
			assert.ok(styleSrc.includes("'sha256-abc123'"), 'Should include first style hash');
			assert.ok(styleSrc.includes("'sha256-def456'"), 'Should include second style hash');

			assert.ok(!csp.has('style-src-elem'), 'Should not have style-src-elem when not configured');
			assert.ok(!csp.has('style-src-attr'), 'Should not have style-src-attr when not configured');
		});

		// Note: Inline style hashing requires the full build pipeline
		// and cannot be easily unit tested. This is tested in integration tests.
	});

	describe('Script Hashes', () => {
		it('should contain script hashes in script-src directive', async () => {
			const pipeline = createCspPipeline({
				scriptHashes: ['sha256-xyz789', 'sha256-uvw456'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const csp = parseCsp(meta.attr('content'));

			assert.ok(csp.has('script-src'), 'Should have script-src directive');
			const scriptSrc = csp.get('script-src');
			assert.ok(scriptSrc.includes("'sha256-xyz789'"), 'Should include first script hash');
			assert.ok(scriptSrc.includes("'sha256-uvw456'"), 'Should include second script hash');

			assert.ok(!csp.has('script-src-elem'), 'Should not have script-src-elem when not configured');
			assert.ok(!csp.has('script-src-attr'), 'Should not have script-src-attr when not configured');
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
			const csp = parseCsp(meta.attr('content'));

			const scriptSrc = csp.get('script-src');
			assert.ok(
				scriptSrc.some((v) => v.includes('sha512-longhash123abc')),
				'Should include SHA-512 hash in script-src',
			);
		});

		it('should generate hashes with SHA-384 algorithm', async () => {
			const pipeline = createCspPipeline({
				algorithm: 'SHA-384',
				scriptHashes: ['sha384-mediumhash456'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const csp = parseCsp(meta.attr('content'));

			const scriptSrc = csp.get('script-src');
			assert.ok(
				scriptSrc.some((v) => v.includes('sha384-mediumhash456')),
				'Should include SHA-384 hash in script-src',
			);
		});
	});

	describe('Custom Hashes', () => {
		it('should render user-provided hashes in the correct directives', async () => {
			const pipeline = createCspPipeline({
				styleHashes: ['sha512-hash1', 'sha384-hash2'],
				scriptHashes: ['sha512-hash3', 'sha384-hash4'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const csp = parseCsp(meta.attr('content'));

			const styleSrc = csp.get('style-src');
			assert.ok(styleSrc.includes("'sha512-hash1'"), 'style-src should include sha512 hash');
			assert.ok(styleSrc.includes("'sha384-hash2'"), 'style-src should include sha384 hash');

			const scriptSrc = csp.get('script-src');
			assert.ok(scriptSrc.includes("'sha512-hash3'"), 'script-src should include sha512 hash');
			assert.ok(scriptSrc.includes("'sha384-hash4'"), 'script-src should include sha384 hash');
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
		it('should include custom resources in the correct directives', async () => {
			const pipeline = createCspPipeline({
				styleResources: ['https://cdn.example.com', 'https://styles.cdn.example.com'],
				scriptResources: ['https://cdn.example.com', 'https://scripts.cdn.example.com'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const csp = parseCsp(meta.attr('content'));

			const scriptSrc = csp.get('script-src');
			assert.ok(scriptSrc.includes('https://cdn.example.com'), 'script-src should include shared CDN');
			assert.ok(
				scriptSrc.includes('https://scripts.cdn.example.com'),
				'script-src should include script CDN',
			);
			assert.ok(
				!scriptSrc.includes('https://styles.cdn.example.com'),
				'script-src should not include style CDN',
			);

			const styleSrc = csp.get('style-src');
			assert.ok(styleSrc.includes('https://cdn.example.com'), 'style-src should include shared CDN');
			assert.ok(
				styleSrc.includes('https://styles.cdn.example.com'),
				'style-src should include style CDN',
			);
			assert.ok(
				!styleSrc.includes('https://scripts.cdn.example.com'),
				'style-src should not include script CDN',
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
			const csp = parseCsp(meta.attr('content'));

			// Check resources are merged in script-src
			const scriptSrc = csp.get('script-src');
			assert.ok(
				scriptSrc.includes('https://global.cdn.example.com'),
				'script-src should include global resource',
			);
			assert.ok(
				scriptSrc.includes('https://scripts.cdn.example.com'),
				'script-src should include runtime-added resource',
			);
			assert.ok(scriptSrc.includes("'sha256-customHash'"), 'script-src should include custom hash');

			// Check style-src has default
			const styleSrc = csp.get('style-src');
			assert.ok(styleSrc.includes("'self'"), 'style-src should have default self');

			// Check directives are merged
			assert.ok(csp.has('default-src'), 'Should have default-src');
			assert.deepEqual(csp.get('default-src'), ["'self'"], 'default-src should be self');
			const imgSrc = csp.get('img-src');
			assert.ok(imgSrc.includes("'self'"), 'img-src should include self');
			assert.ok(
				imgSrc.includes('https://images.cdn.example.com'),
				'img-src should include merged resource',
			);

			// No CSP3 directives should be present
			assert.ok(!csp.has('script-src-elem'), 'Should not have script-src-elem');
			assert.ok(!csp.has('style-src-elem'), 'Should not have style-src-elem');
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
			const csp = parseCsp(meta.attr('content'));

			// Check style resources are merged in style-src
			const styleSrc = csp.get('style-src');
			assert.ok(
				styleSrc.includes('https://global.cdn.example.com'),
				'style-src should include global resource',
			);
			assert.ok(
				styleSrc.includes('https://styles.cdn.example.com'),
				'style-src should include runtime-added resource',
			);
			assert.ok(
				styleSrc.includes("'sha256-customStyleHash'"),
				'style-src should include custom style hash',
			);

			// Check script-src has default
			const scriptSrc = csp.get('script-src');
			assert.ok(scriptSrc.includes("'self'"), 'script-src should have default self');

			// Check directives are merged
			assert.ok(csp.has('default-src'), 'Should have default-src');
			const imgSrc = csp.get('img-src');
			assert.ok(imgSrc.includes("'self'"), 'img-src should include self');
			assert.ok(
				imgSrc.includes('https://images.cdn.example.com'),
				'img-src should include merged resource',
			);

			// No CSP3 directives should be present
			assert.ok(!csp.has('script-src-elem'), 'Should not have script-src-elem');
			assert.ok(!csp.has('style-src-elem'), 'Should not have style-src-elem');
		});
	});

	describe('Strict Dynamic', () => {
		it("should add 'strict-dynamic' to script-src only", async () => {
			const pipeline = createCspPipeline({
				isStrictDynamic: true,
				scriptHashes: ['sha256-test123'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const csp = parseCsp(meta.attr('content'));

			const scriptSrc = csp.get('script-src');
			assert.ok(scriptSrc.includes("'strict-dynamic'"), "script-src should include 'strict-dynamic'");
			assert.ok(scriptSrc.includes("'sha256-test123'"), 'script-src should include hash');

			const styleSrc = csp.get('style-src');
			assert.ok(
				!styleSrc.includes("'strict-dynamic'"),
				"style-src should not include 'strict-dynamic'",
			);
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

			const csp = parseCsp(header);
			const styleSrc = csp.get('style-src');
			assert.ok(styleSrc.includes('https://styles.cdn.example.com'), 'style-src should include resource');
			assert.ok(styleSrc.includes("'sha256-test123'"), 'style-src should include hash');

			const scriptSrc = csp.get('script-src');
			assert.ok(scriptSrc.includes("'self'"), "script-src should default to 'self'");

			assert.ok(!csp.has('script-src-elem'), 'Header should not have script-src-elem');
			assert.ok(!csp.has('style-src-elem'), 'Header should not have style-src-elem');

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			assert.equal(meta.attr('content'), undefined, 'Should not have CSP meta tag');
		});
	});

	describe('CSP Level 3 Directives', () => {
		describe('script-src-elem', () => {
			it('should render script-src-elem directive with hashes and resources', async () => {
				const pipeline = createCspPipeline({
					scriptElemHashes: ['sha256-elemHash1'],
					scriptElemResources: ['https://scripts.cdn.example.com'],
					scriptHashes: ['sha256-mainHash1'],
				}, { experimentalCSPLevel3: true });

				const { html } = await renderPage(SimplePage, pipeline);
				const $ = cheerio.load(html);

				const meta = $('meta[http-equiv="Content-Security-Policy"]');
				const content = meta.attr('content');

				assert.ok(content.includes('script-src-elem'), 'Should have script-src-elem directive');
				assert.ok(content.includes("'sha256-elemHash1'"), 'Should include script-src-elem hash');
				assert.ok(
					content.includes('https://scripts.cdn.example.com'),
					'Should include script-src-elem resource',
				);
			});

			it('should include auto-generated script hashes in script-src-elem when configured', async () => {
				const pipeline = createCspPipeline({
					scriptHashes: ['sha256-autoHash1'],
					scriptElemHashes: ['sha256-elemExtra'],
					scriptElemResources: [],
				}, { experimentalCSPLevel3: true });

				const { html } = await renderPage(SimplePage, pipeline);
				const $ = cheerio.load(html);

				const meta = $('meta[http-equiv="Content-Security-Policy"]');
				const content = meta.attr('content');

				// Parse out the script-src-elem directive
				const scriptElemMatch = /script-src-elem\s+([^;]+)/.exec(content);
				assert.ok(scriptElemMatch, 'Should have script-src-elem directive');

				const scriptElemValue = scriptElemMatch[1];
				// Auto-generated hashes should appear in script-src-elem
				assert.ok(
					scriptElemValue.includes("'sha256-autoHash1'"),
					'Should include auto-generated hash in script-src-elem',
				);
				assert.ok(
					scriptElemValue.includes("'sha256-elemExtra'"),
					'Should include explicit elem hash',
				);
			});
		});

		describe('style-src-elem', () => {
			it('should render style-src-elem directive with hashes and resources', async () => {
				const pipeline = createCspPipeline({
					styleElemHashes: ['sha256-styleElemHash1'],
					styleElemResources: ['https://styles.cdn.example.com'],
					styleHashes: ['sha256-mainStyleHash1'],
				}, { experimentalCSPLevel3: true });

				const { html } = await renderPage(SimplePage, pipeline);
				const $ = cheerio.load(html);

				const meta = $('meta[http-equiv="Content-Security-Policy"]');
				const content = meta.attr('content');

				assert.ok(content.includes('style-src-elem'), 'Should have style-src-elem directive');
				assert.ok(
					content.includes("'sha256-styleElemHash1'"),
					'Should include style-src-elem hash',
				);
				assert.ok(
					content.includes('https://styles.cdn.example.com'),
					'Should include style-src-elem resource',
				);
			});

			it('should include auto-generated style hashes in style-src-elem when configured', async () => {
				const pipeline = createCspPipeline({
					styleHashes: ['sha256-autoStyleHash1'],
					styleElemHashes: ['sha256-styleElemExtra'],
					styleElemResources: [],
				}, { experimentalCSPLevel3: true });

				const { html } = await renderPage(SimplePage, pipeline);
				const $ = cheerio.load(html);

				const meta = $('meta[http-equiv="Content-Security-Policy"]');
				const content = meta.attr('content');

				// Parse out the style-src-elem directive
				const styleElemMatch = /style-src-elem\s+([^;]+)/.exec(content);
				assert.ok(styleElemMatch, 'Should have style-src-elem directive');

				const styleElemValue = styleElemMatch[1];
				// Auto-generated hashes should appear in style-src-elem
				assert.ok(
					styleElemValue.includes("'sha256-autoStyleHash1'"),
					'Should include auto-generated hash in style-src-elem',
				);
				assert.ok(
					styleElemValue.includes("'sha256-styleElemExtra'"),
					'Should include explicit elem hash',
				);
			});
		});

		describe('script-src-attr', () => {
			it('should accept script-src-attr as a valid directive', async () => {
				const pipeline = createCspPipeline({
					directives: ["script-src-attr 'none'"],
				});

				const { html } = await renderPage(SimplePage, pipeline);
				const $ = cheerio.load(html);

				const meta = $('meta[http-equiv="Content-Security-Policy"]');
				const content = meta.attr('content');

				assert.ok(
					content.includes("script-src-attr 'none'"),
					'Should include script-src-attr directive',
				);
			});
		});

		describe('style-src-attr', () => {
			it('should accept style-src-attr as a valid directive', async () => {
				const pipeline = createCspPipeline({
					directives: ["style-src-attr 'unsafe-inline'"],
				});

				const { html } = await renderPage(SimplePage, pipeline);
				const $ = cheerio.load(html);

				const meta = $('meta[http-equiv="Content-Security-Policy"]');
				const content = meta.attr('content');

				assert.ok(
					content.includes("style-src-attr 'unsafe-inline'"),
					'Should include style-src-attr directive',
				);
			});
		});

		describe('Runtime CSP API for Level 3 directives', () => {
			it('should allow injecting script-src-elem resources and hashes via Astro.csp', async () => {
				const pipeline = createCspPipeline({
					scriptElemHashes: [],
					scriptElemResources: [],
				}, { experimentalCSPLevel3: true });

				const PageWithCspLevel3Api = createComponent((result) => {
					const Astro = result.createAstro({}, {});

					Astro.csp.insertScriptElemResource('https://scripts.cdn.example.com');
					Astro.csp.insertScriptElemHash('sha256-runtimeElemHash');

					return render`<html>
						<head>${renderHead(result)}</head>
						<body>${maybeRenderHead(result)}<h1>Test</h1></body>
					</html>`;
				});

				const { html } = await renderPage(PageWithCspLevel3Api, pipeline);
				const $ = cheerio.load(html);

				const meta = $('meta[http-equiv="Content-Security-Policy"]');
				const content = meta.attr('content');

				assert.ok(content.includes('script-src-elem'), 'Should have script-src-elem directive');
				assert.ok(
					content.includes('https://scripts.cdn.example.com'),
					'Should include runtime-added resource',
				);
				assert.ok(
					content.includes("'sha256-runtimeElemHash'"),
					'Should include runtime-added hash',
				);
			});

			it('should allow injecting style-src-elem resources and hashes via Astro.csp', async () => {
				const pipeline = createCspPipeline({
					styleElemHashes: [],
					styleElemResources: [],
				}, { experimentalCSPLevel3: true });

				const PageWithStyleElemApi = createComponent((result) => {
					const Astro = result.createAstro({}, {});

					Astro.csp.insertStyleElemResource('https://styles.cdn.example.com');
					Astro.csp.insertStyleElemHash('sha256-runtimeStyleElemHash');

					return render`<html>
						<head>${renderHead(result)}</head>
						<body>${maybeRenderHead(result)}<h1>Test</h1></body>
					</html>`;
				});

				const { html } = await renderPage(PageWithStyleElemApi, pipeline);
				const $ = cheerio.load(html);

				const meta = $('meta[http-equiv="Content-Security-Policy"]');
				const content = meta.attr('content');

				assert.ok(content.includes('style-src-elem'), 'Should have style-src-elem directive');
				assert.ok(
					content.includes('https://styles.cdn.example.com'),
					'Should include runtime-added style resource',
				);
				assert.ok(
					content.includes("'sha256-runtimeStyleElemHash'"),
					'Should include runtime-added style hash',
				);
			});
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
		it('should generate well-formed CSP content with only expected directives', async () => {
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
			const csp = parseCsp(meta.attr('content'));

			// Check that exactly the expected directives are present
			const directiveNames = Array.from(csp.keys());
			assert.ok(directiveNames.includes('img-src'), 'Should have img-src');
			assert.ok(directiveNames.includes('default-src'), 'Should have default-src');
			assert.ok(directiveNames.includes('script-src'), 'Should have script-src');
			assert.ok(directiveNames.includes('style-src'), 'Should have style-src');
			assert.equal(directiveNames.length, 4, 'Should have exactly 4 directives (no CSP3 extras)');

			// Check script-src has both resources and hashes
			const scriptSrc = csp.get('script-src');
			assert.ok(scriptSrc.includes('https://cdn.example.com'), 'script-src should include resource');
			assert.ok(
				scriptSrc.includes("'sha256-abc123'"),
				'script-src should include hash',
			);

			// Check style-src has both resources and hashes
			const styleSrc = csp.get('style-src');
			assert.ok(
				styleSrc.includes('https://styles.example.com'),
				'style-src should include resource',
			);
			assert.ok(
				styleSrc.includes("'sha256-def456'"),
				'style-src should include hash',
			);
		});
	});
});

// #endregion
