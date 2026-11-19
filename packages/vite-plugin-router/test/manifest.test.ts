import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import astro from '@astrojs/vite-plugin-astro';
import { resolveConfig } from 'vite';
import router from '../dist/index.js';
import { createSerializedManifest } from '../dist/internal/manifest/serialized.js';
import { getRouterRegistry } from '../dist/internal/registry.js';

const host = {
	serverLike: false,
	middlewareMode: 'classic',
	adapterName: '',
	clientDirectives: [],
	userAssetsBase: undefined,
	csp: undefined,
	devToolbar: {
		enabled: false,
		latestAstroVersion: undefined,
		debugInfoOutput: '',
		placement: undefined,
	},
	logLevel: 'info',
} as const;

describe('serialized manifest', () => {
	it('carries the runtime mode', async () => {
		const config = await resolveConfig(
			{ configFile: false, logLevel: 'silent', plugins: [router(), astro()] },
			'serve',
		);
		const registry = getRouterRegistry(config);
		const dev = await createSerializedManifest(registry, host as any, 'development', 'key');
		assert.equal(dev.runtimeMode, 'development');
		const build = await createSerializedManifest(registry, host as any, 'production', 'key');
		assert.equal(build.runtimeMode, 'production');
	});
});
