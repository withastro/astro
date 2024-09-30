import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateSupportedFeatures } from '../../../dist/integrations/features-validation.js';
import {
	normalizeInjectedTypeFilename,
	runHookBuildSetup,
	runHookConfigSetup,
} from '../../../dist/integrations/hooks.js';
import { defaultLogger } from '../test-utils.js';

const defaultConfig = {
	root: new URL('./', import.meta.url),
	srcDir: new URL('src/', import.meta.url),
};

describe('Integration API', () => {
	it('runHookBuildSetup should work', async () => {
		const updatedViteConfig = await runHookBuildSetup({
			config: {
				...defaultConfig,
				integrations: [
					{
						name: 'test',
						hooks: {
							'astro:build:setup'({ updateConfig }) {
								updateConfig({
									define: {
										foo: 'bar',
									},
								});
							},
						},
					},
				],
			},
			vite: {},
			logger: defaultLogger,
			pages: new Map(),
			target: 'server',
		});
		assert.equal(updatedViteConfig.hasOwnProperty('define'), true);
	});

	it('runHookBuildSetup should return updated config', async () => {
		let updatedInternalConfig;
		const updatedViteConfig = await runHookBuildSetup({
			config: {
				...defaultConfig,
				integrations: [
					{
						name: 'test',
						hooks: {
							'astro:build:setup'({ updateConfig }) {
								updatedInternalConfig = updateConfig({
									define: {
										foo: 'bar',
									},
								});
							},
						},
					},
				],
			},
			vite: {},
			logger: defaultLogger,
			pages: new Map(),
			target: 'server',
		});
		assert.deepEqual(updatedViteConfig, updatedInternalConfig);
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
								'astro:config:setup': ({ updateConfig }) => {
									updateConfig({ site });
								},
							},
						},
					],
				},
			},
		});
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
								'astro:config:setup': ({ updateConfig }) => {
									updateConfig({
										integrations: [
											{
												name: 'dynamically-added',
												hooks: {
													// eslint-disable-next-line @typescript-eslint/no-shadow
													'astro:config:setup': ({ updateConfig }) => {
														updateConfig({ site });
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
			},
		});
		assert.equal(updatedSettings.config.site, site);
		assert.equal(updatedSettings.config.integrations.length, 2);
	});
});

describe('Astro feature map', function () {
	it('should support the feature when stable', () => {
		let result = validateSupportedFeatures(
			'test',
			{
				hybridOutput: 'stable',
			},
			{
				output: 'hybrid',
			},
			{},
			defaultLogger,
		);
		assert.equal(result['hybridOutput'], true);
	});

	it('should not support the feature when not provided', () => {
		let result = validateSupportedFeatures(
			'test',
			{},
			{
				output: 'hybrid',
			},
			{},
			defaultLogger,
		);
		assert.equal(result['hybridOutput'], false);
	});

	it('should not support the feature when an empty object is provided', () => {
		let result = validateSupportedFeatures(
			'test',
			{},
			{
				output: 'hybrid',
			},
			{},
			defaultLogger,
		);
		assert.equal(result['hybridOutput'], false);
	});

	describe('static output', function () {
		it('should be supported with the correct config', () => {
			let result = validateSupportedFeatures(
				'test',
				{ staticOutput: 'stable' },
				{
					output: 'static',
				},
				{},
				defaultLogger,
			);
			assert.equal(result['staticOutput'], true);
		});

		it("should not be valid if the config is correct, but the it's unsupported", () => {
			let result = validateSupportedFeatures(
				'test',
				{ staticOutput: 'unsupported' },
				{
					output: 'static',
				},
				{},
				defaultLogger,
			);
			assert.equal(result['staticOutput'], false);
		});
	});
	describe('hybrid output', function () {
		it('should be supported with the correct config', () => {
			let result = validateSupportedFeatures(
				'test',
				{ hybridOutput: 'stable' },
				{
					output: 'hybrid',
				},
				{},
				defaultLogger,
			);
			assert.equal(result['hybridOutput'], true);
		});

		it("should not be valid if the config is correct, but the it's unsupported", () => {
			let result = validateSupportedFeatures(
				'test',
				{
					hybridOutput: 'unsupported',
				},
				{
					output: 'hybrid',
				},
				{},
				defaultLogger,
			);
			assert.equal(result['hybridOutput'], false);
		});
	});
	describe('server output', function () {
		it('should be supported with the correct config', () => {
			let result = validateSupportedFeatures(
				'test',
				{ serverOutput: 'stable' },
				{
					output: 'server',
				},
				{},
				defaultLogger,
			);
			assert.equal(result['serverOutput'], true);
		});

		it("should not be valid if the config is correct, but the it's unsupported", () => {
			let result = validateSupportedFeatures(
				'test',
				{
					serverOutput: 'unsupported',
				},
				{
					output: 'server',
				},
				{},
				defaultLogger,
			);
			assert.equal(result['serverOutput'], false);
		});
	});

	describe('assets', function () {
		it('should be supported when it is sharp compatible', () => {
			let result = validateSupportedFeatures(
				'test',
				{
					assets: {
						supportKind: 'stable',
						isSharpCompatible: true,
					},
				},
				{
					image: {
						service: {
							entrypoint: 'astro/assets/services/sharp',
						},
					},
				},
				{},
				defaultLogger,
			);
			assert.equal(result['assets'], true);
		});
		it('should be supported when it is squoosh compatible', () => {
			let result = validateSupportedFeatures(
				'test',
				{
					assets: {
						supportKind: 'stable',
						isSquooshCompatible: true,
					},
				},
				{
					image: {
						service: {
							entrypoint: 'astro/assets/services/squoosh',
						},
					},
				},
				{},
				defaultLogger,
			);
			assert.equal(result['assets'], true);
		});

		it("should not be valid if the config is correct, but the it's unsupported", () => {
			let result = validateSupportedFeatures(
				'test',
				{
					assets: {
						supportKind: 'unsupported',
						isNodeCompatible: false,
					},
				},
				{
					image: {
						service: {
							entrypoint: 'astro/assets/services/sharp',
						},
					},
				},
				{},
				defaultLogger,
			);
			assert.equal(result['assets'], false);
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
