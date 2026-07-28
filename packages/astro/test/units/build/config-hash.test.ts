import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AstroConfigSchema } from '../../../dist/core/config/schemas/base.js';
import {
	computeConfigHash,
	getConfigHashInput,
} from '../../../dist/core/build/config-hash/index.js';
import type { AstroConfig } from '../../../dist/types/public/config.js';

/** Minimal resolved-config shape carrying every field the projection reads. */
function fakeConfig(overrides = {}): AstroConfig {
	return {
		site: 'https://example.com',
		base: '/',
		trailingSlash: 'ignore',
		output: 'static',
		compressHTML: true,
		scopedStyleStrategy: 'attribute',
		build: {
			format: 'directory',
			assets: '_astro',
			assetsPrefix: undefined,
			inlineStylesheets: 'auto',
			redirects: true,
		},
		redirects: {},
		i18n: undefined,
		image: { service: { entrypoint: 'astro/assets/services/sharp', config: {} } },
		markdown: { syntaxHighlight: 'shiki', gfm: true },
		env: { schema: {}, validateSecrets: false },
		security: { csp: false, checkOrigin: true },
		prefetch: undefined,
		experimental: { clientPrerender: false, incrementalBuild: true },
		// Fields the projection must ignore:
		outDir: new URL('file:///project/dist/'),
		publicDir: new URL('file:///project/public/'),
		vite: {},
		...overrides,
	} as unknown as AstroConfig;
}

describe('getConfigHashInput', () => {
	it('selects only the output-affecting fields', () => {
		const input = getConfigHashInput(fakeConfig());
		assert.deepEqual(Object.keys(input).sort(), [
			'base',
			'build',
			'compressHTML',
			'env',
			'experimental',
			'i18n',
			'image',
			'markdown',
			'output',
			'prefetch',
			'redirects',
			'scopedStyleStrategy',
			'security',
			'site',
			'trailingSlash',
			'vite',
		]);
	});

	it('omits location-only top-level fields', () => {
		const input = getConfigHashInput(fakeConfig());
		assert.ok(!('outDir' in input));
		assert.ok(!('publicDir' in input));
	});

	it('includes only the allowlisted vite fields', () => {
		const input = getConfigHashInput(fakeConfig());
		assert.deepEqual(Object.keys(input.vite).sort(), ['build', 'css', 'define', 'esbuild', 'json']);
		assert.deepEqual(Object.keys(input.vite.build).sort(), [
			'assetsInlineLimit',
			'cssMinify',
			'cssTarget',
			'minify',
			'target',
		]);
	});
});

describe('computeConfigHash', () => {
	it('is stable across runs for equal config', () => {
		assert.equal(computeConfigHash(fakeConfig()), computeConfigHash(fakeConfig()));
	});

	it('is stable when object key order differs', () => {
		const a = computeConfigHash(fakeConfig({ build: { format: 'directory', assets: '_astro' } }));
		const b = computeConfigHash(fakeConfig({ build: { assets: '_astro', format: 'directory' } }));
		assert.equal(a, b);
	});

	it('changes when an output-affecting value changes', () => {
		assert.notEqual(
			computeConfigHash(fakeConfig({ site: 'https://example.com' })),
			computeConfigHash(fakeConfig({ site: 'https://other.example' })),
		);
	});

	it('changes when a compiler-baked value changes', () => {
		assert.notEqual(
			computeConfigHash(fakeConfig({ compressHTML: true })),
			computeConfigHash(fakeConfig({ compressHTML: false })),
		);
	});

	it('ignores changes to excluded fields', () => {
		assert.equal(
			computeConfigHash(fakeConfig({ outDir: new URL('file:///a/') })),
			computeConfigHash(fakeConfig({ outDir: new URL('file:///b/') })),
		);
	});

	it('does not track function identity inside included fields', () => {
		const a = fakeConfig({ markdown: { syntaxHighlight: 'shiki', remarkPlugins: [() => {}] } });
		const b = fakeConfig({ markdown: { syntaxHighlight: 'shiki', remarkPlugins: [() => 42] } });
		assert.equal(computeConfigHash(a), computeConfigHash(b));
	});

	it('changes when an output-affecting vite option changes', () => {
		assert.notEqual(
			computeConfigHash(fakeConfig({ vite: { build: { assetsInlineLimit: 4096 } } })),
			computeConfigHash(fakeConfig({ vite: { build: { assetsInlineLimit: 0 } } })),
		);
	});

	it('ignores vite fields outside the allowlist', () => {
		assert.equal(
			computeConfigHash(fakeConfig({ vite: { server: { port: 3000 }, plugins: [() => {}] } })),
			computeConfigHash(fakeConfig({ vite: { server: { port: 4000 }, plugins: [() => 42] } })),
		);
	});
});

describe('config schema coverage guard', () => {
	// When this fails, a top-level config key was added or removed. Classify it:
	// add output-affecting keys to `getConfigHashInput`, then list it here.
	const INCLUDED = [
		'site',
		'base',
		'trailingSlash',
		'output',
		'compressHTML',
		'scopedStyleStrategy',
		'build',
		'redirects',
		'prefetch',
		'image',
		'markdown',
		'i18n',
		'security',
		'env',
		'vite',
		'experimental',
	];
	// Keys that do not affect prerendered output (dev/SSR-runtime/tooling/location).
	const EXCLUDED = [
		'root',
		'srcDir',
		'publicDir',
		'outDir',
		'cacheDir',
		'adapter',
		'integrations',
		'server',
		'devToolbar',
		'session',
		'prerenderConflictBehavior',
		'fetchFile',
		'logger',
		'fonts',
		'cache',
		'routeRules',
		'legacy',
	];

	it('classifies every top-level config key', () => {
		const schemaKeys = Object.keys(AstroConfigSchema.shape).sort();
		const classified = [...INCLUDED, ...EXCLUDED].sort();
		assert.deepEqual(schemaKeys, classified);
	});
});
