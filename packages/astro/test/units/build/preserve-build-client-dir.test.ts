import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroSettings } from '../../../dist/types/astro.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import { getOutFolder } from '../../../dist/core/build/common.js';
import { getClientOutputDirectory } from '../../../dist/prerender/utils.js';
import { prepareAssetsGenerationEnv } from '../../../dist/assets/build/generate.js';
import { createSettings } from './test-helpers.ts';

describe('preserveBuildClientDir', () => {
	const outDir = new URL('file:///project/dist/');
	const clientDir = new URL('file:///project/dist/client/');

	describe('getClientOutputDirectory', () => {
		it('returns outDir for static builds without preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'static' }) as unknown as AstroSettings;
			const result = getClientOutputDirectory(settings);
			assert.equal(result.href, outDir.href);
		});

		it('returns client dir for static builds with preserveBuildClientDir', () => {
			const settings = createSettings({
				buildOutput: 'static',
				preserveBuildClientDir: true,
			}) as unknown as AstroSettings;
			const result = getClientOutputDirectory(settings);
			assert.equal(result.href, clientDir.href);
		});

		it('returns client dir for server builds regardless of preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'server' }) as unknown as AstroSettings;
			const result = getClientOutputDirectory(settings);
			assert.equal(result.href, clientDir.href);
		});
	});

	describe('getOutFolder', () => {
		const pageRoute = { type: 'page', isIndex: false } as unknown as RouteData;

		it('outputs to outDir for static builds without preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'static' }) as unknown as AstroSettings;
			const result = getOutFolder(settings, '/about', pageRoute);
			assert.equal(result.href, new URL('about/', outDir).href);
		});

		it('outputs to client dir for static builds with preserveBuildClientDir', () => {
			const settings = createSettings({
				buildOutput: 'static',
				preserveBuildClientDir: true,
			}) as unknown as AstroSettings;
			const result = getOutFolder(settings, '/about', pageRoute);
			assert.equal(result.href, new URL('about/', clientDir).href);
		});

		it('outputs to client dir for server builds regardless of preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'server' }) as unknown as AstroSettings;
			const result = getOutFolder(settings, '/about', pageRoute);
			assert.equal(result.href, new URL('about/', clientDir).href);
		});

		it('outputs root index to client dir with preserveBuildClientDir', () => {
			const settings = createSettings({
				buildOutput: 'static',
				preserveBuildClientDir: true,
			}) as unknown as AstroSettings;
			const indexRoute = { type: 'page', isIndex: true } as unknown as RouteData;
			const result = getOutFolder(settings, '/', indexRoute);
			assert.equal(result.href, new URL('./', clientDir).href);
		});
	});

	describe('prepareAssetsGenerationEnv', () => {
		it('uses client dir for image source/output in static builds with preserveBuildClientDir', async () => {
			const options = {
				settings: {
					buildOutput: 'static',
					adapter: { adapterFeatures: { preserveBuildClientDir: true } },
					config: {
						outDir,
						cacheDir: new URL('file:///tmp/astro-test-cache/'),
						build: {
							client: clientDir,
							server: new URL('file:///project/dist/server/'),
							assets: '_astro',
						},
						image: {},
					},
				},
				logger: { info() {}, warn() {}, error() {}, debug() {} },
			};

			const env = await prepareAssetsGenerationEnv(options as any, 0);
			// With preserveBuildClientDir, both serverRoot and clientRoot should
			// point to the client dir so images are read from and written to the
			// correct location.
			assert.equal(env.serverRoot.href, clientDir.href);
			assert.equal(env.clientRoot.href, clientDir.href);
		});

		it('does not use client dir in static builds without preserveBuildClientDir', async () => {
			const options = {
				settings: {
					buildOutput: 'static',
					adapter: undefined,
					config: {
						outDir,
						cacheDir: new URL('file:///tmp/astro-test-cache/'),
						build: {
							client: clientDir,
							server: new URL('file:///project/dist/server/'),
							assets: '_astro',
						},
						image: {},
					},
				},
				logger: { info() {}, warn() {}, error() {}, debug() {} },
			};

			const env = await prepareAssetsGenerationEnv(options as any, 0);
			// Without preserveBuildClientDir, serverRoot and clientRoot should NOT
			// be the client dir — they should use outDir (or a fallback).
			assert.notEqual(env.serverRoot.href, clientDir.href);
			assert.notEqual(env.clientRoot.href, clientDir.href);
		});
	});
});
