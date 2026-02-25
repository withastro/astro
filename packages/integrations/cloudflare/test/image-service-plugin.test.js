import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createImageServicePlugins } from '../dist/vite-plugin-image-service.js';

describe('createImageServicePlugins', () => {
	const plugins = createImageServicePlugins({
		prerenderEntrypoint: '@astrojs/cloudflare/image-service-workerd',
		runtimeEntrypoint: 'astro/assets/services/noop',
		getBuildServiceEntrypoint: () => undefined,
		onService: () => {},
	});

	const interceptor = plugins[0];
	const emitter = plugins[1];

	it('returns two plugins', () => {
		assert.equal(plugins.length, 2);
	});

	it('interceptor has enforce: pre', () => {
		assert.equal(interceptor.enforce, 'pre');
	});

	it('interceptor resolves virtual:image-service', () => {
		const result = interceptor.resolveId.handler.call({}, 'virtual:image-service');
		assert.equal(result, '\0cloudflare:image-service');
	});

	it('interceptor load generates code with isPrerender ternary', () => {
		const code = interceptor.load.handler.call({}, '\0cloudflare:image-service');
		assert.ok(code.includes("import { isPrerender } from 'virtual:astro-cloudflare:config'"));
		assert.ok(
			code.includes(
				'import prerenderService from "@astrojs/cloudflare/image-service-workerd"',
			),
		);
		assert.ok(code.includes('import runtimeService from "astro/assets/services/noop"'));
		assert.ok(code.includes('export default isPrerender ? prerenderService : runtimeService'));
	});

	it('emitter applies only to ssr environment', () => {
		assert.equal(emitter.applyToEnvironment({ name: 'ssr' }), true);
		assert.equal(emitter.applyToEnvironment({ name: 'client' }), false);
		assert.equal(emitter.applyToEnvironment({ name: 'prerender' }), false);
	});

	it('emitter generateBundle invokes onService with the compiled filename', () => {
		let capturedPath;
		const testPlugins = createImageServicePlugins({
			prerenderEntrypoint: '@astrojs/cloudflare/image-service-workerd',
			runtimeEntrypoint: 'astro/assets/services/noop',
			getBuildServiceEntrypoint: () => 'my-custom-service',
			onService: (relativePath) => {
				capturedPath = relativePath;
			},
		});

		const testEmitter = testPlugins[1];

		// Mock rollup context for buildStart — emitFile returns a reference ID
		const emitFileRef = 'ref_123';
		const mockBuildStartCtx = {
			emitFile: (opts) => {
				assert.equal(opts.type, 'chunk');
				assert.equal(opts.id, 'my-custom-service');
				return emitFileRef;
			},
		};
		testEmitter.buildStart.call(mockBuildStartCtx);

		// Mock rollup context for generateBundle — getFileName resolves the reference
		const mockGenerateBundleCtx = {
			getFileName: (ref) => {
				assert.equal(ref, emitFileRef);
				return 'chunks/custom-image-service-abc123.mjs';
			},
		};
		testEmitter.generateBundle.call(mockGenerateBundleCtx);

		assert.equal(capturedPath, 'chunks/custom-image-service-abc123.mjs');
	});

	it('emitter generateBundle does nothing when no build service entrypoint is set', () => {
		const testPlugins = createImageServicePlugins({
			prerenderEntrypoint: '@astrojs/cloudflare/image-service-workerd',
			runtimeEntrypoint: 'astro/assets/services/noop',
			getBuildServiceEntrypoint: () => undefined,
			onService: () => {
				assert.fail('onService should not be called');
			},
		});

		const testEmitter = testPlugins[1];

		// buildStart with no entrypoint — emitFile should not be called
		const mockBuildStartCtx = {
			emitFile: () => {
				assert.fail('emitFile should not be called');
			},
		};
		testEmitter.buildStart.call(mockBuildStartCtx);

		// generateBundle should be a no-op
		const mockGenerateBundleCtx = {
			getFileName: () => {
				assert.fail('getFileName should not be called');
			},
		};
		testEmitter.generateBundle.call(mockGenerateBundleCtx);
	});
});
