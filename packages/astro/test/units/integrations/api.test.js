import { expect } from 'chai';
import { runHookBuildSetup } from '../../../dist/integrations/index.js';
import { validateSupportedFeatures } from '../../../dist/integrations/astroFeaturesValidation.js';
import { defaultLogging } from '../test-utils.js';

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
			logging: {},
			pages: new Map(),
			target: 'server',
		});
		expect(updatedViteConfig).to.haveOwnProperty('define');
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
			defaultLogging
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
			defaultLogging
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
			defaultLogging
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
				defaultLogging
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
				defaultLogging
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
				defaultLogging
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
				defaultLogging
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
				defaultLogging
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
				defaultLogging
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
				defaultLogging
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
				defaultLogging
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
				defaultLogging
			);
			expect(result['assets']).to.be.false;
		});
	});
});
