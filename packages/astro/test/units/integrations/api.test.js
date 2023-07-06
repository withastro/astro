import { expect } from 'chai';
import { runHookBuildSetup } from '../../../dist/integrations/index.js';
import { validateSupportedFeatures } from '../../../dist/integrations/index.js';
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

describe('Integration feature map', function () {
	it('should support the feature when stable', () => {
		let result = validateSupportedFeatures(
			'test',
			{
				edgeMiddleware: 'Stable',
			},
			{
				build: {
					excludeMiddleware: true,
				},
			},
			defaultLogging
		);
		expect(result['edgeMiddleware']).to.be.true;
	});

	it('should not support the feature when not provided', () => {
		let result = validateSupportedFeatures(
			'test',
			undefined,
			{
				build: {
					excludeMiddleware: true,
				},
			},
			defaultLogging
		);
		expect(result['edgeMiddleware']).to.be.false;
	});

	it('should not support the feature when an empty object is provided', () => {
		let result = validateSupportedFeatures(
			'test',
			{},
			{
				build: {
					excludeMiddleware: true,
				},
			},
			defaultLogging
		);
		expect(result['edgeMiddleware']).to.be.false;
	});

	describe('edge middleware feature', function () {
		it('should be supported with the correct config', () => {
			let result = validateSupportedFeatures(
				'test',
				{
					edgeMiddleware: 'Stable',
				},
				{
					build: {
						excludeMiddleware: true,
					},
				},
				defaultLogging
			);
			expect(result['edgeMiddleware']).to.be.true;
		});

		it("should not be valid if the config is correct, but the it's unsupported", () => {
			let result = validateSupportedFeatures(
				'test',
				{
					edgeMiddleware: 'Unsupported',
				},
				{
					build: {
						excludeMiddleware: true,
					},
				},
				defaultLogging
			);
			expect(result['edgeMiddleware']).to.be.false;
		});
	});
	describe('function per page feature', function () {
		it('should be supported with the correct config', () => {
			let result = validateSupportedFeatures(
				'test',
				{ functionPerPage: 'Stable' },
				{
					build: {
						split: true,
					},
					output: 'server',
				},
				defaultLogging
			);
			expect(result['functionPerPage']).to.be.true;
		});

		it("should not be valid if the config is correct, but the it's unsupported", () => {
			// the output: server is missing
			let result = validateSupportedFeatures(
				'test',
				{
					functionPerPage: 'Unsupported',
				},
				{
					build: {
						split: true,
					},
					output: 'server',
				},
				defaultLogging
			);
			expect(result['functionPerPage']).to.be.false;
		});
	});
	describe('static output', function () {
		it('should be supported with the correct config', () => {
			let result = validateSupportedFeatures(
				'test',
				{ staticOutput: 'Stable' },
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
				{ staticOutput: 'Unsupported' },
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
				{ hybridOutput: 'Stable' },
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
					hybridOutput: 'Unsupported',
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
				{ serverOutput: 'Stable' },
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
					serverOutput: 'Unsupported',
				},
				{
					output: 'server',
				},
				defaultLogging
			);
			expect(result['serverOutput']).to.be.false;
		});
	});
});
