import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import astro from '@astrojs/vite-plugin-astro';
import { resolveConfig } from 'vite';
import router, { getRouterApi } from '../dist/index.js';
import {
	createManifestExtensionsCode,
	createManifestImportsCode,
	createPipelineModuleCode,
} from '../dist/pipeline-module.js';
import { getDevPageScriptSrc, RouterRegistry } from '../dist/internal/registry.js';
import { clientRouterInitPlugin } from '../dist/transitions/client-router-init.js';
import { vitePluginTransitions } from '../dist/transitions/vite-plugin-transitions.js';

describe('RouterRegistry', () => {
	it('records fetch handlers in registration order and rejects duplicate names', () => {
		const registry = new RouterRegistry();
		registry.api.addFetchHandler('a', { entrypoint: '/a.js', order: 'pre' });
		registry.api.addFetchHandler('b', { entrypoint: new URL('file:///b.js'), order: 'post' });
		assert.deepEqual(registry.fetchHandlers, [
			{ name: 'a', entrypoint: '/a.js', order: 'pre' },
			{ name: 'b', entrypoint: '/b.js', order: 'post' },
		]);
		assert.throws(
			() => registry.api.addFetchHandler('a', { entrypoint: '/c.js', order: 'pre' }),
			/fetch handler named "a" is already registered/,
		);
	});

	it('lists page scripts in registration order and drops dev-only ones from builds', () => {
		const registry = new RouterRegistry();
		registry.api.addPageScript('virtual:a');
		registry.api.addPageScript(new URL('file:///b.js'), { devOnly: true });
		registry.api.addPageScript('virtual:c', { devOnly: false });
		assert.deepEqual(registry.getPageScripts('dev'), ['virtual:a', '/b.js', 'virtual:c']);
		assert.deepEqual(registry.getPageScripts('build'), ['virtual:a', 'virtual:c']);
		assert.equal(getDevPageScriptSrc('virtual:a'), '/@id/virtual:a');
		assert.equal(getDevPageScriptSrc('/b.js'), '/@id//b.js');
		registry.reset();
		assert.deepEqual(registry.getPageScripts('dev'), []);
		registry.freeze();
		assert.throws(() => registry.api.addPageScript('virtual:d'), /configResolved/);
	});

	it('rejects duplicate manifest and render context keys', () => {
		const registry = new RouterRegistry();
		registry.api.extendManifest('actions' as never, 'virtual:a');
		assert.throws(() => registry.api.extendManifest('actions' as never, 'virtual:b'), /"actions"/);
		registry.api.extendRenderContext('session' as never, '/s.js');
		assert.throws(() => registry.api.extendRenderContext('session' as never, '/t.js'), /"session"/);
	});

	it('keeps internal routes apart from injected routes', () => {
		const registry = new RouterRegistry();
		registry.api.injectRoute({ pattern: '/a', entrypoint: '/a.ts' });
		registry.api.injectRoute({ pattern: '/_b', entrypoint: '/b.ts' }, { internal: true });
		assert.deepEqual(registry.injectedRoutes, [{ pattern: '/a', entrypoint: '/a.ts' }]);
		assert.deepEqual(registry.internalRoutes, [{ pattern: '/_b', entrypoint: '/b.ts' }]);
		registry.reset();
		assert.equal(registry.internalRoutes.length, 0);
	});

	it('records route table transforms in order and drops them on reset()', () => {
		const registry = new RouterRegistry();
		const first = () => {};
		const second = () => [];
		registry.api.transformRoutes(first);
		registry.api.transformRoutes(second);
		assert.deepEqual(registry.routeTransforms, [first, second]);
		registry.reset();
		assert.deepEqual(registry.routeTransforms, []);
		registry.freeze();
		assert.throws(() => registry.api.transformRoutes(first), /transformRoutes/);
	});

	it('rejects registrations after it is frozen', () => {
		const registry = new RouterRegistry();
		registry.freeze();
		assert.throws(() => registry.api.addMiddleware('/m.js', 'pre'), /configResolved/);
	});

	it('throws when routes are read before they are resolved, then runs callbacks', async () => {
		const registry = new RouterRegistry();
		assert.throws(() => registry.api.routes, /before the route table was resolved/);
		const seen: unknown[] = [];
		registry.api.onRoutesResolved((routes) => {
			seen.push(routes);
		});
		await registry.setRoutes([]);
		assert.deepEqual(registry.api.routes, []);
		assert.deepEqual(seen, [[]]);
	});

	it('records page extensions once each and drops them on reset()', () => {
		const registry = new RouterRegistry();
		registry.api.addPageExtension('.md');
		registry.api.addPageExtension('.md');
		registry.api.addPageExtension('.mdx');
		assert.deepEqual(registry.pageExtensions, ['.md', '.mdx']);
		registry.reset();
		assert.deepEqual(registry.pageExtensions, []);
	});

	it('reset() drops registrations so a second config resolution starts clean', () => {
		const registry = new RouterRegistry();
		registry.api.addFetchHandler('a', { entrypoint: '/a.js', order: 'pre' });
		registry.freeze();
		registry.reset();
		registry.api.addFetchHandler('a', { entrypoint: '/a.js', order: 'pre' });
		assert.equal(registry.fetchHandlers.length, 1);
	});
});

describe('pipeline module', () => {
	it('imports every registered handler and extension', () => {
		const registry = new RouterRegistry();
		registry.api.addFetchHandler('a', { entrypoint: '/a.js', order: 'pre' });
		registry.api.extendRenderContext('session' as never, '/s.js');
		const code = createPipelineModuleCode(registry);
		assert.match(code, /import _handler0 from "\/a\.js";/);
		assert.match(code, /import _extension0 from "\/s\.js";/);
		assert.match(
			code,
			/export const fetchHandlers = \[\{ name: "a", order: "pre", handler: _handler0 \}\];/,
		);
		assert.match(
			code,
			/export const renderContextExtensions = \[\{ key: "session", extension: _extension0 \}\];/,
		);
	});

	it('emits a lazy manifest entry per extension and freezes the registry', () => {
		const registry = new RouterRegistry();
		registry.api.extendManifest('actions' as never, 'virtual:astro:actions/entrypoint');
		const code = createManifestExtensionsCode(registry);
		assert.match(code, /pipeline: \(\) => import\("virtual:astro:pipeline"\),/);
		assert.match(code, /"actions": \(\) => import\("virtual:astro:actions\/entrypoint"\),/);
		assert.throws(() => registry.api.extendManifest('x' as never, 'y'), /configResolved/);
	});
});

describe('manifest data and routing extensions', () => {
	it('serializes manifest data, calling functions, and rejects duplicate keys', () => {
		const registry = new RouterRegistry();
		let calls = 0;
		registry.api.setManifestData('a' as never, { x: 1 } as never);
		registry.api.setManifestData('b' as never, (() => ++calls) as never);
		assert.throws(() => registry.api.setManifestData('a' as never, 2 as never), /"a"/);
		assert.deepEqual(registry.serializeManifestData(), { a: { x: 1 }, b: 1 });
		assert.deepEqual(registry.serializeManifestData(), { a: { x: 1 }, b: 2 });
		assert.throws(() => registry.api.setManifestData('c' as never, 3 as never), /configResolved/);
	});

	it('imports routing extensions statically and lists them in the manifest', () => {
		const registry = new RouterRegistry();
		registry.api.extendRouting('/r0.js');
		registry.api.extendRouting(new URL('file:///r1.js'));
		assert.equal(
			createManifestImportsCode(registry),
			'import _routing0 from "/r0.js";\nimport _routing1 from "/r1.js";',
		);
		assert.match(createManifestExtensionsCode(registry), /routing: \[_routing0, _routing1\],/);
	});

	it('runs prerender callbacks in registration order', async () => {
		const registry = new RouterRegistry();
		const calls: string[] = [];
		registry.api.onPrerenderDone(async () => {
			calls.push('done1');
		});
		registry.api.onPrerenderDone(() => {
			calls.push('done2');
		});
		registry.api.onPrerenderPathRestored(({ pathname }) => {
			calls.push(`restored ${pathname}`);
		});
		await registry.prerenderDone({
			prerenderer: undefined,
			metadata: [],
			builder: {} as never,
			outputDirectories: {} as never,
		});
		registry.prerenderPathRestored({ pathname: '/a', route: {} as never, metadata: {} });
		assert.deepEqual(calls, ['done1', 'done2', 'restored /a']);
	});
});

describe('client router modules', () => {
	function load(plugin: any, id: string): string {
		return plugin.load.handler.call({}, id).code;
	}

	it('lists the client router init modules in registration order and freezes the registry', () => {
		const registry = new RouterRegistry();
		registry.api.addClientRouterInit('virtual:a');
		registry.api.addClientRouterInit(new URL('file:///b.js'));
		const code = load(clientRouterInitPlugin(registry), '\0virtual:astro:client-router-init');
		assert.match(code, /import _init0 from "virtual:a";/);
		assert.match(code, /import _init1 from "\/b.js";/);
		assert.match(code, /export default \[_init0, _init1\];/);
		assert.throws(() => registry.api.addClientRouterInit('/c.js'), /configResolved/);
	});

	it('re-exports the transitions modules from the given specifiers', () => {
		const plugin = vitePluginTransitions({ clientRouter: 'host/ClientRouter.astro' });
		const server = load(plugin, '\0astro:transitions');
		assert.match(server, /export \{ default as ClientRouter \} from "host\/ClientRouter.astro"/);
		assert.match(server, /from "@astrojs\/runtime\/_internal\/transitions\/index.js"/);
		const client = load(plugin, '\0astro:transitions/client');
		assert.match(client, /from "@astrojs\/vite-plugin-router\/_internal\/transitions\/router.js"/);
	});
});

describe('api.astroRouter', () => {
	it('accepts registrations from configResolved, in any plugin order', async () => {
		let api: ReturnType<typeof getRouterApi> | undefined;
		const feature = {
			name: 'feature',
			configResolved(config: any) {
				api = getRouterApi(config);
				api.addFetchHandler('feature', { entrypoint: '/feature.js', order: 'post' });
			},
		};
		await resolveConfig(
			{ configFile: false, logLevel: 'silent', plugins: [feature, router(), astro()] },
			'serve',
		);
		assert.ok(api);
	});

	it('exposes the resolved config', async () => {
		let api: ReturnType<typeof getRouterApi> | undefined;
		const feature = {
			name: 'feature',
			configResolved(config: any) {
				api = getRouterApi(config);
			},
		};
		await resolveConfig(
			{
				configFile: false,
				logLevel: 'silent',
				plugins: [feature, router({ output: 'server', build: { format: 'file' } }), astro()],
			},
			'build',
		);
		assert.equal(api?.config.output, 'server');
		assert.equal(api?.config.build.format, 'file');
		assert.equal(api?.config.build.assets, '_astro');
		assert.equal(api?.config.serverOutput, undefined);
	});

	it('hasServerOutput() is true with serverOutput or an on-demand project route', async () => {
		const route = (prerender: boolean, origin = 'project') =>
			({ type: 'page', origin, prerender }) as any;
		const withServerOutput = new RouterRegistry(() => ({ serverOutput: {} }) as any);
		withServerOutput.reset({} as any);
		await withServerOutput.setRoutes([route(true)]);
		assert.equal(withServerOutput.api.hasServerOutput(), true);

		const registry = new RouterRegistry(() => ({ serverOutput: undefined }) as any);
		registry.reset({} as any);
		assert.throws(() => registry.api.hasServerOutput(), /before the route table was resolved/);
		await registry.setRoutes([route(true), route(false, 'internal')]);
		assert.equal(registry.api.hasServerOutput(), false);
		await registry.setRoutes([route(true), route(false)]);
		assert.equal(registry.api.hasServerOutput(), true);
	});
});
