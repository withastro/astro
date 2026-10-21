import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	normalizeCodegenDir,
	normalizeInjectedTypeFilename,
	toIntegrationResolvedRoute,
} from '../../../dist/integrations/hooks.js';
import {
	getAdapterStaticRecommendation,
	getSupportMessage,
	unwrapSupportKind,
} from '../../../dist/integrations/features-validation.js';
import { resolveMiddlewareMode } from '../../../dist/integrations/adapter-utils.js';
import { createRouteData } from '../mocks.ts';
import { dynamicPart, makeRoute, spreadPart, staticPart } from '../routing/test-helpers.ts';

import type {
	AdapterSupport,
	AstroAdapterFeatures,
} from '../../../dist/types/public/integrations.js';

// #region normalizeCodegenDir
describe('normalizeCodegenDir', () => {
	it('preserves alphanumeric, dots, and hyphens', () => {
		assert.equal(normalizeCodegenDir('my-integration'), './integrations/my-integration/');
	});

	it('replaces slashes', () => {
		assert.equal(normalizeCodegenDir('@scope/plugin'), './integrations/_scope_plugin/');
	});

	it('replaces spaces and special characters', () => {
		assert.equal(normalizeCodegenDir('has space!@#$'), './integrations/has_space____/');
	});

	it('preserves dots in name', () => {
		assert.equal(normalizeCodegenDir('my.integration.v2'), './integrations/my.integration.v2/');
	});

	it('handles empty string', () => {
		assert.equal(normalizeCodegenDir(''), './integrations//');
	});

	it('replaces unicode characters', () => {
		assert.equal(normalizeCodegenDir('cafe\u0301'), './integrations/cafe_/');
	});
});
// #endregion

// #region normalizeInjectedTypeFilename
describe('normalizeInjectedTypeFilename', () => {
	it('throws when filename does not end with .d.ts', () => {
		assert.throws(
			() => normalizeInjectedTypeFilename('types.ts', 'my-integration'),
			/does not end with/,
		);
	});

	it('throws for plain filename without extension', () => {
		assert.throws(
			() => normalizeInjectedTypeFilename('types', 'my-integration'),
			/does not end with/,
		);
	});

	it('does not throw for valid .d.ts filename', () => {
		assert.doesNotThrow(() => normalizeInjectedTypeFilename('types.d.ts', 'my-integration'));
	});

	it('returns normalized path with integration dir prefix', () => {
		assert.equal(
			normalizeInjectedTypeFilename('types.d.ts', 'my-integration'),
			'./integrations/my-integration/types.d.ts',
		);
	});

	it('sanitizes special characters in filename', () => {
		assert.equal(
			normalizeInjectedTypeFilename('my types!.d.ts', 'my-integration'),
			'./integrations/my-integration/my_types_.d.ts',
		);
	});

	it('sanitizes special characters in integration name', () => {
		assert.equal(
			normalizeInjectedTypeFilename('types.d.ts', '@scope/pkg'),
			'./integrations/_scope_pkg/types.d.ts',
		);
	});

	it('handles both filename and integration name with special chars', () => {
		assert.equal(
			normalizeInjectedTypeFilename('aA1-*/_"~.d.ts', 'aA1-*/_"~.'),
			'./integrations/aA1-_____./aA1-_____.d.ts',
		);
	});
});
// #endregion

// #region toIntegrationResolvedRoute
describe('toIntegrationResolvedRoute', () => {
	it('maps RouteData fields to IntegrationResolvedRoute fields', () => {
		const route = makeRoute({
			route: '/blog/[slug]',
			segments: [[staticPart('blog')], [dynamicPart('slug')]],
			trailingSlash: 'ignore',
			pathname: undefined,
		});
		const result = toIntegrationResolvedRoute(route, 'ignore');

		assert.equal(result.isPrerendered, false);
		assert.equal(result.entrypoint, route.component);
		assert.equal(result.pattern, '/blog/[slug]');
		assert.deepEqual(result.params, ['slug']);
		assert.equal(result.origin, 'project');
		assert.equal(result.patternRegex, route.pattern);
		assert.deepEqual(result.segments, route.segments);
		assert.equal(result.type, 'page');
		assert.equal(result.pathname, undefined);
		assert.equal(result.redirect, undefined);
		assert.equal(result.redirectRoute, undefined);
		assert.deepEqual(result.fallbackRoutes, []);
	});

	it('generate function produces correct path from params', () => {
		const route = makeRoute({
			route: '/blog/[slug]',
			segments: [[staticPart('blog')], [dynamicPart('slug')]],
			trailingSlash: 'ignore',
			pathname: undefined,
		});
		const result = toIntegrationResolvedRoute(route, 'ignore');

		assert.equal(result.generate({ slug: 'hello-world' }), '/blog/hello-world');
	});

	it('handles static routes with pathname', () => {
		const route = createRouteData({ route: '/about' });
		const result = toIntegrationResolvedRoute(route, 'ignore');

		assert.equal(result.pathname, '/about');
		assert.equal(result.pattern, '/about');
		assert.deepEqual(result.params, []);
	});

	it('maps prerendered routes correctly', () => {
		const route = createRouteData({ route: '/page', prerender: true });
		const result = toIntegrationResolvedRoute(route, 'ignore');
		assert.equal(result.isPrerendered, true);
	});

	it('recursively maps redirectRoute', () => {
		const targetRoute = createRouteData({ route: '/new-blog' });
		const route = createRouteData({ route: '/old-blog', type: 'redirect' });
		route.redirect = '/new-blog';
		route.redirectRoute = targetRoute;

		const result = toIntegrationResolvedRoute(route, 'ignore');
		assert.equal(result.type, 'redirect');
		assert.ok(result.redirectRoute);
		assert.equal(result.redirectRoute.pattern, '/new-blog');
	});

	it('recursively maps fallbackRoutes', () => {
		const fallback = createRouteData({ route: '/en/blog' });
		fallback.origin = 'internal';
		const route = createRouteData({ route: '/blog' });
		route.fallbackRoutes = [fallback];

		const result = toIntegrationResolvedRoute(route, 'ignore');
		assert.equal(result.fallbackRoutes.length, 1);
		assert.equal(result.fallbackRoutes[0].pattern, '/en/blog');
		assert.equal(result.fallbackRoutes[0].origin, 'internal');
	});

	it('applies trailingSlash "always" to generate function', () => {
		const route = createRouteData({ route: '/about' });
		const result = toIntegrationResolvedRoute(route, 'always');
		assert.equal(result.generate({}), '/about/');
	});

	it('applies trailingSlash "never" to generate function', () => {
		const route = createRouteData({ route: '/about' });
		const result = toIntegrationResolvedRoute(route, 'never');
		const generated = result.generate({});
		assert.ok(!generated.endsWith('/') || generated === '/');
	});

	it('handles endpoint route type', () => {
		const route = createRouteData({ route: '/api/data', type: 'endpoint' });
		const result = toIntegrationResolvedRoute(route, 'ignore');
		assert.equal(result.type, 'endpoint');
	});

	it('handles spread params in generate', () => {
		const route = makeRoute({
			route: '/blog/[...slug]',
			segments: [[staticPart('blog')], [spreadPart('...slug')]],
			trailingSlash: 'ignore',
			pathname: undefined,
		});
		const result = toIntegrationResolvedRoute(route, 'ignore');
		assert.equal(result.generate({ slug: 'a/b/c' }), '/blog/a/b/c');
	});
});
// #endregion

// #region resolveMiddlewareMode
describe('resolveMiddlewareMode', () => {
	it('returns "classic" when features is undefined', () => {
		assert.equal(resolveMiddlewareMode(undefined), 'classic');
	});

	it('returns "classic" when features is empty object', () => {
		assert.equal(resolveMiddlewareMode({}), 'classic');
	});

	it('returns the middlewareMode value when explicitly set', () => {
		assert.equal(resolveMiddlewareMode({ middlewareMode: 'edge' }), 'edge');
	});

	it('returns "classic" when middlewareMode is "classic"', () => {
		assert.equal(resolveMiddlewareMode({ middlewareMode: 'classic' }), 'classic');
	});

	it('returns "edge" for deprecated edgeMiddleware: true', () => {
		assert.equal(resolveMiddlewareMode({ edgeMiddleware: true } as AstroAdapterFeatures), 'edge');
	});

	it('returns "classic" for deprecated edgeMiddleware: false', () => {
		assert.equal(
			resolveMiddlewareMode({ edgeMiddleware: false } as AstroAdapterFeatures),
			'classic',
		);
	});

	it('middlewareMode takes precedence over edgeMiddleware', () => {
		assert.equal(
			resolveMiddlewareMode({
				middlewareMode: 'classic',
				edgeMiddleware: true,
			} as AstroAdapterFeatures),
			'classic',
		);
	});
});
// #endregion

// #region getAdapterStaticRecommendation
describe('getAdapterStaticRecommendation', () => {
	it('returns recommendation for @astrojs/vercel/static', () => {
		const result = getAdapterStaticRecommendation('@astrojs/vercel/static');
		assert.ok(result);
		assert.ok(result.includes('@astrojs/vercel/serverless'));
	});

	it('returns undefined for unknown adapter', () => {
		assert.equal(getAdapterStaticRecommendation('unknown-adapter'), undefined);
	});

	it('returns undefined for empty string', () => {
		assert.equal(getAdapterStaticRecommendation(''), undefined);
	});

	it('returns undefined for similar but non-matching adapter name', () => {
		assert.equal(getAdapterStaticRecommendation('@astrojs/vercel'), undefined);
	});
});
// #endregion

// #region unwrapSupportKind
describe('unwrapSupportKind', () => {
	it('returns undefined when supportKind is undefined', () => {
		assert.equal(unwrapSupportKind(undefined), undefined);
	});

	it('returns the string directly when supportKind is a string', () => {
		assert.equal(unwrapSupportKind('stable'), 'stable');
	});

	it('returns support from object when supportKind is an object', () => {
		assert.equal(
			unwrapSupportKind({ support: 'experimental', message: 'Beta feature' }),
			'experimental',
		);
	});

	it('handles all stability levels as strings', () => {
		assert.equal(unwrapSupportKind('stable'), 'stable');
		assert.equal(unwrapSupportKind('deprecated'), 'deprecated');
		assert.equal(unwrapSupportKind('unsupported'), 'unsupported');
		assert.equal(unwrapSupportKind('experimental'), 'experimental');
		assert.equal(unwrapSupportKind('limited'), 'limited');
	});

	it('returns undefined for falsy values', () => {
		assert.equal(unwrapSupportKind(undefined), undefined);
	});
});
// #endregion

// #region getSupportMessage
describe('getSupportMessage', () => {
	it('returns undefined when supportKind is a string', () => {
		assert.equal(getSupportMessage('stable'), undefined);
	});

	it('returns the message when supportKind is an object with message', () => {
		assert.equal(
			getSupportMessage({ support: 'experimental', message: 'Beta feature' }),
			'Beta feature',
		);
	});

	it('returns undefined when supportKind is an object without message', () => {
		assert.equal(getSupportMessage({ support: 'stable' } as unknown as AdapterSupport), undefined);
	});
});
// #endregion
