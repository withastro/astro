import { deepEqual } from 'node:assert';
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateSupportedFeatures } from '../../../dist/integrations/features-validation.js';
import {
	normalizeCodegenDir,
	normalizeInjectedTypeFilename,
	runHookBuildSetup,
	runHookConfigSetup,
} from '../../../dist/integrations/hooks.js';
import { defaultLogger } from '../test-utils.ts';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import { logHandlers } from '../../../dist/core/logger/handlers.js';
import nodeLoggerFactory from '../../../dist/core/logger/impls/node.js';

import type { AstroConfig } from '../../../dist/types/public/config.js';
import type { AstroSettings } from '../../../dist/types/astro.js';

const defaultConfig: Record<string, unknown> = {
	root: new URL('./', import.meta.url),
	srcDir: new URL('src/', import.meta.url),
	build: {},
	image: {
		remotePatterns: [],
	},
	outDir: new URL('./dist/', import.meta.url),
	publicDir: new URL('./public/', import.meta.url),
	experimental: {},
};

const dotAstroDir = new URL('./.astro/', defaultConfig.root as URL);

describe('Integration API', () => {
	it('runHookBuildSetup should work', async () => {
		const updatedViteConfig = await runHookBuildSetup({
			config: {
				...defaultConfig,
				integrations: [
					{
						name: 'test',
						hooks: {
							'astro:build:setup'({ updateConfig }: { updateConfig: (cfg: object) => object }) {
								updateConfig({
									define: {
										foo: 'bar',
									},
								});
							},
						},
					},
				],
			} as unknown as AstroConfig,
			vite: {},
			logger: defaultLogger,
			pages: new Map(),
			target: 'server',
		});
		assert.equal(updatedViteConfig.hasOwnProperty('define'), true);
	});

	it('runHookBuildSetup should return updated config', async () => {
		let updatedInternalConfig: unknown;
		const updatedViteConfig = await runHookBuildSetup({
			config: {
				...defaultConfig,
				integrations: [
					{
						name: 'test',
						hooks: {
							'astro:build:setup'({ updateConfig }: { updateConfig: (cfg: object) => object }) {
								updatedInternalConfig = updateConfig({
									define: {
										foo: 'bar',
									},
								});
							},
						},
					},
				],
			} as unknown as AstroConfig,
			vite: {},
			logger: defaultLogger,
			pages: new Map(),
			target: 'server',
		});
		deepEqual(updatedViteConfig, updatedInternalConfig);
	});

	it('runHookConfigSetup can update Astro config', async () => {
		const site = 'https://test.com/';
		const updatedSettings = await runHookConfigSetup({
			logger: defaultLogger,
			settings: {
				config: {
					...defaultConfig,
					integrations: [
						{
							name: 'test',
							hooks: {
								'astro:config:setup': ({
									updateConfig,
								}: {
									updateConfig: (cfg: object) => void;
								}) => {
									updateConfig({ site });
								},
							},
						},
					],
				},
				dotAstroDir,
			} as unknown as AstroSettings,
		} as Parameters<typeof runHookConfigSetup>[0]);
		assert.equal(updatedSettings.config.site, site);
	});

	it('runHookConfigSetup runs integrations added by another integration', async () => {
		const site = 'https://test.com/';
		const updatedSettings = await runHookConfigSetup({
			logger: defaultLogger,
			settings: {
				config: {
					...defaultConfig,
					integrations: [
						{
							name: 'test',
							hooks: {
								'astro:config:setup': ({
									updateConfig,
								}: {
									updateConfig: (cfg: object) => void;
								}) => {
									updateConfig({
										integrations: [
											{
												name: 'dynamically-added',
												hooks: {
													'astro:config:setup': ({
														updateConfig: innerUpdateConfig,
													}: {
														updateConfig: (cfg: object) => void;
													}) => {
														innerUpdateConfig({ site });
													},
												},
											},
										],
									});
								},
							},
						},
					],
				},
				dotAstroDir,
			} as unknown as AstroSettings,
		} as Parameters<typeof runHookConfigSetup>[0]);
		assert.equal(updatedSettings.config.site, site);
		assert.equal(updatedSettings.config.integrations.length, 2);
	});

	it('runHookConfigSetup updates the logger destination when an integration sets a custom logger', async () => {
		const logger = new AstroLogger({
			destination: nodeLoggerFactory(),
			level: 'info',
		});
		const initialDestination = logger.options.destination;

		await runHookConfigSetup({
			logger,
			settings: {
				config: {
					...defaultConfig,
					integrations: [
						{
							name: 'custom',
							hooks: {
								'astro:config:setup': ({
									updateConfig,
								}: {
									updateConfig: (cfg: object) => void;
								}) => {
									updateConfig({ logger: logHandlers.json() });
								},
							},
						},
					],
				},
				dotAstroDir,
			} as unknown as AstroSettings,
		} as Parameters<typeof runHookConfigSetup>[0]);

		// The destination should have been replaced by the JSON logger destination.
		assert.notEqual(logger.options.destination, initialDestination);

		// And logging should now emit structured JSON via the console API.
		const originalInfo = console.info;
		let captured = '';
		console.info = (...args: unknown[]) => {
			captured += args.map(String).join(' ');
		};
		try {
			logger.info('config', 'hello from integration');
		} finally {
			console.info = originalInfo;
		}

		const parsed = JSON.parse(captured);
		assert.equal(parsed.message, 'hello from integration');
		assert.equal(parsed.label, 'config');
		assert.equal(parsed.level, 'info');
	});
});

describe('Astro feature map', function () {
	it('should support the feature when stable', () => {
		const result = validateSupportedFeatures(
			'test',
			{
				hybridOutput: 'stable',
			},
			{
				config: { output: 'static' },
			} as unknown as AstroSettings,
			defaultLogger,
		);
		assert.equal(result['hybridOutput'], true);
	});

	it('should not support the feature when not provided', () => {
		const result = validateSupportedFeatures(
			'test',
			{},
			{
				buildOutput: 'server',
				config: { output: 'static' },
			} as unknown as AstroSettings,
			defaultLogger,
		);
		assert.equal(result['hybridOutput'], false);
	});

	it('should not support the feature when an empty object is provided', () => {
		const result = validateSupportedFeatures(
			'test',
			{},
			{
				buildOutput: 'server',
				config: { output: 'static' },
			} as unknown as AstroSettings,
			defaultLogger,
		);
		assert.equal(result['hybridOutput'], false);
	});

	describe('static output', function () {
		it('should be supported with the correct config', () => {
			const result = validateSupportedFeatures(
				'test',
				{ staticOutput: 'stable' },
				{
					config: { output: 'static' },
				} as unknown as AstroSettings,
				defaultLogger,
			);
			assert.equal(result['staticOutput'], true);
		});

		it("should not be valid if the config is correct, but the it's unsupported", () => {
			const result = validateSupportedFeatures(
				'test',
				{ staticOutput: 'unsupported' },
				{
					buildOutput: 'static',
					config: { output: 'static' },
				} as unknown as AstroSettings,
				defaultLogger,
			);
			assert.equal(result['staticOutput'], false);
		});
	});
	describe('hybrid output', function () {
		it('should be supported with the correct config', () => {
			const result = validateSupportedFeatures(
				'test',
				{ hybridOutput: 'stable' },
				{
					config: { output: 'static' },
				} as unknown as AstroSettings,
				defaultLogger,
			);
			assert.equal(result['hybridOutput'], true);
		});

		it("should not be valid if the config is correct, but the it's unsupported", () => {
			const result = validateSupportedFeatures(
				'test',
				{
					hybridOutput: 'unsupported',
				},
				{
					buildOutput: 'server',
					config: { output: 'static' },
				} as unknown as AstroSettings,
				defaultLogger,
			);
			assert.equal(result['hybridOutput'], false);
		});
	});
	describe('server output', function () {
		it('should be supported with the correct config', () => {
			const result = validateSupportedFeatures(
				'test',
				{ serverOutput: 'stable' },
				{
					config: { output: 'server' },
				} as unknown as AstroSettings,
				defaultLogger,
			);
			assert.equal(result['serverOutput'], true);
		});

		it("should not be valid if the config is correct, but the it's unsupported", () => {
			const result = validateSupportedFeatures(
				'test',
				{
					serverOutput: 'unsupported',
				},
				{
					config: { output: 'server' },
				} as unknown as AstroSettings,
				defaultLogger,
			);
			assert.equal(result['serverOutput'], false);
		});
	});
});

describe('normalizeInjectedTypeFilename', () => {
	// invalid filename
	assert.throws(() => normalizeInjectedTypeFilename('types', 'integration'));
	// valid filename
	assert.doesNotThrow(() => normalizeInjectedTypeFilename('types.d.ts', 'integration'));
	// filename normalization
	assert.equal(
		normalizeInjectedTypeFilename('aA1-*/_"~.d.ts', 'integration'),
		'./integrations/integration/aA1-_____.d.ts',
	);
	// integration name normalization
	assert.equal(
		normalizeInjectedTypeFilename('types.d.ts', 'aA1-*/_"~.'),
		'./integrations/aA1-_____./types.d.ts',
	);
});

describe('normalizeCodegenDir', () => {
	assert.equal(normalizeCodegenDir('aA1-*/_"~.'), './integrations/aA1-_____./');
});
