import { expect } from 'chai';
import { runHookBuildSetup, runHookConfigSetup } from '../../../dist/integrations/index.js';
import { validateSupportedFeatures } from '../../../dist/integrations/astroFeaturesValidation.js';
import { defaultLogger } from '../test-utils.js';

describe('Integration API', () => {
	it('runHookBuildSetup should work', async () => {
		const updatedViteConfig = await runHookBuildSetup({
			config: {
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
		expect(updatedViteConfig).to.haveOwnProperty('define');
	});

	it('runHookConfigSetup can update Astro config', async () => {
		const site = 'https://test.com/';
		const updatedSettings = await runHookConfigSetup({
			logger: defaultLogger,
			settings: {
				config: {
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
		expect(updatedSettings.config.site).to.equal(site);
	});

	it('runHookConfigSetup runs integrations added by another integration', async () => {
		const site = 'https://test.com/';
		const updatedSettings = await runHookConfigSetup({
			logger: defaultLogger,
			settings: {
				config: {
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
		expect(updatedSettings.config.site).to.equal(site);
		expect(updatedSettings.config.integrations.length).to.equal(2);
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
			defaultLogger
		);
		expect(result['hybridOutput']).to.be.true;
	});

	it('should not support the feature when not provided', () => {
		let result = validateSupportedFeatures(
			'test',
			undefined,
			{
				output: 'hybrid',
			},
			defaultLogger
		);
		expect(result['hybridOutput']).to.be.false;
	});

	it('should not support the feature when an empty object is provided', () => {
		let result = validateSupportedFeatures(
			'test',
			{},
			{
				output: 'hybrid',
			},
			defaultLogger
		);
		expect(result['hybridOutput']).to.be.false;
	});

	describe('static output', function () {
		it('should be supported with the correct config', () => {
			let result = validateSupportedFeatures(
				'test',
				{ staticOutput: 'stable' },
				{
					output: 'static',
				},
				defaultLogger
			);
			expect(result['staticOutput']).to.be.true;
		});

		it("should not be valid if the config is correct, but the it's unsupported", () => {
			let result = validateSupportedFeatures(
				'test',
				{ staticOutput: 'unsupported' },
				{
					output: 'static',
				},
				defaultLogger
			);
			expect(result['staticOutput']).to.be.false;
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
				defaultLogger
			);
			expect(result['hybridOutput']).to.be.true;
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
				defaultLogger
			);
			expect(result['hybridOutput']).to.be.false;
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
				defaultLogger
			);
			expect(result['serverOutput']).to.be.true;
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
				defaultLogger
			);
			expect(result['serverOutput']).to.be.false;
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
				defaultLogger
			);
			expect(result['assets']).to.be.true;
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
				defaultLogger
			);
			expect(result['assets']).to.be.true;
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
				defaultLogger
			);
			expect(result['assets']).to.be.false;
		});
	});
});
