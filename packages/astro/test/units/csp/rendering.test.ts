import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import {
	createComponent,
	maybeRenderHead,
	render,
	renderHead,
} from '../../../dist/runtime/server/index.js';
import type { SSRManifestCSP } from '../../../dist/types/public/internal.js';
import type { Pipeline } from '../../../dist/core/render/index.js';
import type { AstroLogger } from '../../../dist/core/logger/core.js';
import { createBasicPipeline, renderThroughMiddleware, SpyLogger } from '../test-utils.ts';

// #region Test Utilities

/**
 * Flat test DSL mapped to the config-shaped manifest. `*Elem`/`*Attr` options are turned into
 * `kind`-scoped entries; a `-elem`/`-attr` directive is emitted only when it has such entries.
 */
type CspTestConfig = {
	cspDestination?: SSRManifestCSP['cspDestination'];
	algorithm?: SSRManifestCSP['algorithm'];
	directives?: SSRManifestCSP['directives'];
	scriptHashes?: string[];
	scriptResources?: string[];
	styleHashes?: string[];
	styleResources?: string[];
	isStrictDynamic?: boolean;
	scriptElemResources?: string[];
	scriptElemHashes?: string[];
	scriptAttrResources?: string[];
	scriptAttrHashes?: string[];
	styleElemResources?: string[];
	styleElemHashes?: string[];
	styleAttrResources?: string[];
	styleAttrHashes?: string[];
};

function createCspPipeline(config: CspTestConfig = {}, logger?: AstroLogger): Pipeline {
	const pipeline = createBasicPipeline(logger ? { logger } : undefined);
	const resources = (defaults?: string[], element?: string[], attribute?: string[]) => [
		...(defaults ?? []),
		...(element ?? []).map((resource) => ({ resource, kind: 'element' as const })),
		...(attribute ?? []).map((resource) => ({ resource, kind: 'attribute' as const })),
	];
	const hashes = (defaults?: string[], element?: string[], attribute?: string[]) => [
		...(defaults ?? []),
		...(element ?? []).map((hash) => ({ hash, kind: 'element' as const })),
		...(attribute ?? []).map((hash) => ({ hash, kind: 'attribute' as const })),
	];
	// manifest is readonly, so we use Object.defineProperty to override it for testing
	Object.defineProperty(pipeline, 'manifest', {
		value: {
			...pipeline.manifest,
			shouldInjectCspMetaTags: true,
			csp: {
				cspDestination: config.cspDestination,
				algorithm: config.algorithm || 'SHA-256',
				directives: config.directives || [],
				scriptDirective: {
					resources: resources(
						config.scriptResources,
						config.scriptElemResources,
						config.scriptAttrResources,
					),
					hashes: hashes(config.scriptHashes, config.scriptElemHashes, config.scriptAttrHashes),
					strictDynamic: config.isStrictDynamic || false,
				},
				styleDirective: {
					resources: resources(
						config.styleResources,
						config.styleElemResources,
						config.styleAttrResources,
					),
					hashes: hashes(config.styleHashes, config.styleElemHashes, config.styleAttrHashes),
				},
			},
		},
		writable: false,
		configurable: true,
	});
	return pipeline;
}

/** Parse a CSP string into a map of directive name -> source tokens. */
function parseCsp(content: string): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const part of content.split(';')) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const [directive, ...resources] = trimmed.split(/\s+/);
		map.set(directive, resources);
	}
	return map;
}

async function renderPage(
	PageComponent: ReturnType<typeof createComponent>,
	pipeline: Pipeline,
	prerender = true,
): Promise<{ html: string; response: Response }> {
	const PageModule = { default: PageComponent };
	const request = new Request('http://localhost/');
	const routeData = {
		type: 'page' as const,
		route: '/index',
		pathname: '/index',
		component: 'src/pages/index.astro',
		params: [] as string[],
		segments: [] as any[],
		pattern: /^\/$/ as RegExp,
		distURL: [] as URL[],
		prerender,
		fallbackRoutes: [] as any[],
		isIndex: true,
		origin: 'project' as const,
	};

	const state = new FetchState(pipeline, request);
	state.routeData = routeData as any;
	state.pathname = '/index';
	state.clientAddress = '127.0.0.1';
	const response = await renderThroughMiddleware(state, PageModule);
	const html = await response.text();

	return { html, response };
}

// #endregion

// #region Reusable Components

/** Simple page component */
const SimplePage = createComponent(() => {
	return render`<html>
		<head>${renderHead()}</head>
		<body>${maybeRenderHead()}<h1>Test</h1></body>
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
			const content = meta.attr('content')!;

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
			const content = meta.attr('content')!;

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
			const content = meta.attr('content')!;

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
			const content = meta.attr('content')!;

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
			const content = meta.attr('content')!;

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
			const content = meta.attr('content')!;

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
			const content = meta.attr('content')!;

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
			const content = meta.attr('content')!;

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

			const PageWithCspApi = createComponent((result: any) => {
				const Astro = result.createAstro({}, {});

				// Use runtime CSP API
				Astro.csp.insertScriptResource('https://scripts.cdn.example.com');
				Astro.csp.insertScriptHash('sha256-customHash');
				Astro.csp.insertDirective("default-src 'self'");
				Astro.csp.insertDirective('img-src https://images.cdn.example.com');

				return render`<html>
				<head>${renderHead()}</head>
				<body>${maybeRenderHead()}<h1>Scripts</h1></body>
			</html>`;
			});

			const { html } = await renderPage(PageWithCspApi, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content')!;

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

			const PageWithStyleApi = createComponent((result: any) => {
				const Astro = result.createAstro({}, {});

				// Use runtime CSP API for styles
				Astro.csp.insertStyleResource('https://styles.cdn.example.com');
				Astro.csp.insertStyleHash('sha256-customStyleHash');
				Astro.csp.insertDirective("default-src 'self'");
				Astro.csp.insertDirective('img-src https://images.cdn.example.com');

				return render`<html>
				<head>${renderHead()}</head>
				<body>${maybeRenderHead()}<h1>Styles</h1></body>
			</html>`;
			});

			const { html } = await renderPage(PageWithStyleApi, pipeline);
			const $ = cheerio.load(html);

			const meta = $('meta[http-equiv="Content-Security-Policy"]');
			const content = meta.attr('content')!;

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
			const content = meta.attr('content')!;

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
			const content = meta.attr('content')!;

			assert.equal(content.includes('font-src'), false, 'Should not include font-src directive');
		});
	});

	describe('Granular directives (kind)', () => {
		it('moves Astro element hashes into script-src-elem instead of duplicating them on script-src', async () => {
			const pipeline = createCspPipeline({
				scriptHashes: ['sha256-island'],
				scriptElemResources: ['https://cdn.example.com'],
				scriptElemHashes: ['sha256-userElem'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const parsed = parseCsp(
				cheerio.load(html)('meta[http-equiv="Content-Security-Policy"]').attr('content')!,
			);

			// The generated hash moves to `script-src-elem` (which governs `<script>` elements); the
			// baseline only keeps `'self'`, since the browser won't fall back to it.
			assert.deepEqual(parsed.get('script-src'), ["'self'"]);
			assert.deepEqual(parsed.get('script-src-elem'), [
				'https://cdn.example.com',
				"'sha256-island'",
				"'sha256-userElem'",
			]);
		});

		it('moves Astro element hashes into style-src-elem instead of duplicating them on style-src', async () => {
			const pipeline = createCspPipeline({
				styleHashes: ['sha256-css'],
				styleElemResources: ["'self'"],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const parsed = parseCsp(
				cheerio.load(html)('meta[http-equiv="Content-Security-Policy"]').attr('content')!,
			);

			assert.deepEqual(parsed.get('style-src'), ["'self'"]);
			assert.deepEqual(parsed.get('style-src-elem'), ["'self'", "'sha256-css'"]);
		});

		it('does not fold Astro element hashes into script-src-attr', async () => {
			const pipeline = createCspPipeline({
				scriptHashes: ['sha256-island'],
				scriptAttrResources: ["'unsafe-inline'"],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const parsed = parseCsp(
				cheerio.load(html)('meta[http-equiv="Content-Security-Policy"]').attr('content')!,
			);

			// Only the user-provided attribute source — Astro's element hashes are NOT folded in.
			assert.deepEqual(parsed.get('script-src-attr'), ["'unsafe-inline'"]);
		});

		it('allows inline style attributes via style-src-attr', async () => {
			const pipeline = createCspPipeline({
				styleAttrResources: ["'unsafe-inline'"],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const parsed = parseCsp(
				cheerio.load(html)('meta[http-equiv="Content-Security-Policy"]').attr('content')!,
			);

			assert.deepEqual(parsed.get('style-src-attr'), ["'unsafe-inline'"]);
		});

		it("does not emit a contradictory 'none' when an attribute hash is provided without resources", async () => {
			const pipeline = createCspPipeline({
				styleAttrHashes: ['sha256-attrHash'],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const parsed = parseCsp(
				cheerio.load(html)('meta[http-equiv="Content-Security-Policy"]').attr('content')!,
			);

			assert.deepEqual(parsed.get('style-src-attr'), ["'sha256-attrHash'"]);
		});

		it("inherits 'strict-dynamic' onto script-src-elem", async () => {
			const pipeline = createCspPipeline({
				isStrictDynamic: true,
				scriptHashes: ['sha256-island'],
				scriptElemResources: ["'self'"],
			});

			const { html } = await renderPage(SimplePage, pipeline);
			const parsed = parseCsp(
				cheerio.load(html)('meta[http-equiv="Content-Security-Policy"]').attr('content')!,
			);

			assert.ok(
				parsed.get('script-src')?.includes("'strict-dynamic'"),
				'script-src has strict-dynamic',
			);
			assert.ok(
				parsed.get('script-src-elem')?.includes("'strict-dynamic'"),
				'script-src-elem inherits strict-dynamic',
			);
		});

		it('omits more-specific directives when not enabled', async () => {
			const pipeline = createCspPipeline({ scriptHashes: ['sha256-island'] });

			const { html } = await renderPage(SimplePage, pipeline);
			const content = cheerio
				.load(html)('meta[http-equiv="Content-Security-Policy"]')
				.attr('content')!;

			assert.ok(!content.includes('script-src-elem'), 'no script-src-elem');
			assert.ok(!content.includes('script-src-attr'), 'no script-src-attr');
			assert.ok(!content.includes('style-src-elem'), 'no style-src-elem');
			assert.ok(!content.includes('style-src-attr'), 'no style-src-attr');
		});
	});

	describe('Runtime CSP API - kind', () => {
		it('routes element and attribute inserts to the right directives', async () => {
			const pipeline = createCspPipeline({ scriptHashes: ['sha256-island'] });

			const PageWithKindApi = createComponent((result: any) => {
				const Astro = result.createAstro({}, {});
				Astro.csp.insertScriptResource({ resource: 'https://cdn.example.com', kind: 'element' });
				Astro.csp.insertScriptHash({ hash: 'sha256-elemHash', kind: 'element' });
				Astro.csp.insertStyleResource({ resource: "'unsafe-inline'", kind: 'attribute' });
				return render`<html><head>${renderHead()}</head><body>${maybeRenderHead()}<h1>Kind</h1></body></html>`;
			});

			const { html } = await renderPage(PageWithKindApi, pipeline);
			const parsed = parseCsp(
				cheerio.load(html)('meta[http-equiv="Content-Security-Policy"]').attr('content')!,
			);

			assert.ok(parsed.get('script-src-elem')?.includes('https://cdn.example.com'));
			// element insert folds the auto hash + the runtime element hash.
			assert.ok(parsed.get('script-src-elem')?.includes("'sha256-island'"));
			assert.ok(parsed.get('script-src-elem')?.includes("'sha256-elemHash'"));
			assert.deepEqual(parsed.get('style-src-attr'), ["'unsafe-inline'"]);
		});

		it('a bare string still targets the default directive (back-compat)', async () => {
			const pipeline = createCspPipeline();

			const PageWithDefaultApi = createComponent((result: any) => {
				const Astro = result.createAstro({}, {});
				Astro.csp.insertScriptResource('https://scripts.cdn.example.com');
				return render`<html><head>${renderHead()}</head><body>${maybeRenderHead()}<h1>Default</h1></body></html>`;
			});

			const { html } = await renderPage(PageWithDefaultApi, pipeline);
			const parsed = parseCsp(
				cheerio.load(html)('meta[http-equiv="Content-Security-Policy"]').attr('content')!,
			);

			assert.ok(parsed.get('script-src')?.includes('https://scripts.cdn.example.com'));
			assert.ok(!parsed.has('script-src-elem'), 'should not create script-src-elem');
		});

		it('warns about the fallback when general resources coexist with an element insert', async () => {
			const logger = new SpyLogger();
			const pipeline = createCspPipeline(
				{ scriptResources: ['https://global.cdn.example.com'] },
				logger,
			);

			const PageWithElemInsert = createComponent((result: any) => {
				const Astro = result.createAstro({}, {});
				Astro.csp.insertScriptResource({ resource: 'https://cdn.example.com', kind: 'element' });
				return render`<html><head>${renderHead()}</head><body>${maybeRenderHead()}<h1>Warn</h1></body></html>`;
			});

			await renderPage(PageWithElemInsert, pipeline);

			const cspWarnings = logger.logs.filter(
				(l) => l.label === 'csp' && l.level === 'warn' && l.message.includes('script-src-elem'),
			);
			assert.equal(cspWarnings.length, 1, 'should warn exactly once about the fallback');
		});

		it('does not warn when only Astro defaults exist on the general directive', async () => {
			const logger = new SpyLogger();
			const pipeline = createCspPipeline({ scriptHashes: ['sha256-island'] }, logger);

			const PageWithElemInsert = createComponent((result: any) => {
				const Astro = result.createAstro({}, {});
				Astro.csp.insertScriptResource({ resource: 'https://cdn.example.com', kind: 'element' });
				return render`<html><head>${renderHead()}</head><body>${maybeRenderHead()}<h1>NoWarn</h1></body></html>`;
			});

			await renderPage(PageWithElemInsert, pipeline);

			const cspWarnings = logger.logs.filter(
				(l) => l.label === 'csp' && l.message.includes('fall back'),
			);
			assert.equal(cspWarnings.length, 0, 'should not warn when no custom general resources exist');
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
			const content = meta.attr('content')!;

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
				scriptSrc!.resources.includes('https://cdn.example.com'),
				'script-src should include resource',
			);
			assert.ok(
				scriptSrc!.resources.some((r) => r.includes('sha256-abc123')),
				'script-src should include hash',
			);

			// Check style-src has both resources and hashes
			const styleSrc = parsed.find((p) => p.directive === 'style-src');
			assert.ok(
				styleSrc!.resources.includes('https://styles.example.com'),
				'style-src should include resource',
			);
			assert.ok(
				styleSrc!.resources.some((r) => r.includes('sha256-def456')),
				'style-src should include hash',
			);
		});
	});
});

// #endregion
