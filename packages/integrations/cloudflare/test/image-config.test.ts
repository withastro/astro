import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import {
	DEFAULT_IMAGE_SERVICE,
	type ImageServiceConfig,
	normalizeImageServiceConfig,
	setImageConfig,
} from '../dist/utils/image-config.js';

const NOOP_SERVICE = 'astro/assets/services/noop';
const SHARP_SERVICE = 'astro/assets/services/sharp';
const WORKERD_SERVICE = '@astrojs/cloudflare/image-service-workerd';
const EXTERNAL_SERVICE = '@astrojs/cloudflare/image-service';
const GENERIC_ENDPOINT = 'astro/assets/endpoint/generic';
const PASSTHROUGH_ENDPOINT = '@astrojs/cloudflare/image-passthrough-endpoint';
const TRANSFORM_ENDPOINT = '@astrojs/cloudflare/image-transform-endpoint';

function makeLogger() {
	const warnings: string[] = [];
	const infos: string[] = [];
	return {
		warnings,
		infos,
		logger: {
			warn: (msg: string) => warnings.push(msg),
			info: (msg: string) => infos.push(msg),
		} as unknown as AstroIntegrationLogger,
	};
}

function makeImageConfig(serviceEntrypoint = SHARP_SERVICE, endpointEntrypoint?: string) {
	return {
		service: { entrypoint: serviceEntrypoint, config: {} },
		endpoint: { route: '/_image', entrypoint: endpointEntrypoint },
	} as unknown as AstroConfig['image'];
}

describe('normalizeImageServiceConfig', () => {
	const cases: Array<{
		name: string;
		input: ImageServiceConfig | undefined;
		expected: {
			buildService: string;
			runtimeService: string;
			transformAtBuild: boolean;
		};
	}> = [
		{
			name: 'undefined compiles at build and uses the binding at runtime',
			input: undefined,
			expected: {
				buildService: 'compile',
				runtimeService: 'cloudflare-binding',
				transformAtBuild: true,
			},
		},
		{
			name: "'passthrough' never transforms",
			input: 'passthrough',
			expected: {
				buildService: 'passthrough',
				runtimeService: 'passthrough',
				transformAtBuild: false,
			},
		},
		{
			name: "'cloudflare' defers to the external CDN at both phases",
			input: 'cloudflare',
			expected: {
				buildService: 'cloudflare',
				runtimeService: 'cloudflare',
				transformAtBuild: false,
			},
		},
		{
			name: "'cloudflare-binding' stays runtime-only",
			input: 'cloudflare-binding',
			expected: {
				buildService: 'cloudflare-binding',
				runtimeService: 'cloudflare-binding',
				transformAtBuild: false,
			},
		},
		{
			name: "'compile' falls back to passthrough at runtime",
			input: 'compile',
			expected: {
				buildService: 'compile',
				runtimeService: 'passthrough',
				transformAtBuild: true,
			},
		},
		{
			name: "'custom' leaves both phases to the user service",
			input: 'custom',
			expected: { buildService: 'custom', runtimeService: 'custom', transformAtBuild: false },
		},
		{
			name: "{ build: 'compile' } defaults runtime to passthrough",
			input: { build: 'compile' },
			expected: {
				buildService: 'compile',
				runtimeService: 'passthrough',
				transformAtBuild: true,
			},
		},
		{
			name: "{ build: 'compile', runtime: 'passthrough' } is explicit about the same pairing",
			input: { build: 'compile', runtime: 'passthrough' },
			expected: {
				buildService: 'compile',
				runtimeService: 'passthrough',
				transformAtBuild: true,
			},
		},
		{
			name: "{ build: 'compile', runtime: 'cloudflare-binding' } splits the two phases",
			input: { build: 'compile', runtime: 'cloudflare-binding' },
			expected: {
				buildService: 'compile',
				runtimeService: 'cloudflare-binding',
				transformAtBuild: true,
			},
		},
		{
			name: "{ build: 'cloudflare-binding' } mirrors the build mode into runtime",
			input: { build: 'cloudflare-binding' },
			expected: {
				buildService: 'cloudflare-binding',
				runtimeService: 'cloudflare-binding',
				transformAtBuild: true,
			},
		},
		{
			name: "{ build: 'cloudflare-binding', runtime: 'passthrough' } transforms only at build",
			input: { build: 'cloudflare-binding', runtime: 'passthrough' },
			expected: {
				buildService: 'cloudflare-binding',
				runtimeService: 'passthrough',
				transformAtBuild: true,
			},
		},
		{
			name: "{ build: 'cloudflare-binding', runtime: 'cloudflare-binding' } transforms at both phases",
			input: { build: 'cloudflare-binding', runtime: 'cloudflare-binding' },
			expected: {
				buildService: 'cloudflare-binding',
				runtimeService: 'cloudflare-binding',
				transformAtBuild: true,
			},
		},
	];

	for (const { name, input, expected } of cases) {
		it(name, () => {
			assert.deepEqual(normalizeImageServiceConfig(input), expected);
		});
	}

	it('resolves undefined to exactly the same shape as the explicit default', () => {
		assert.deepEqual(
			normalizeImageServiceConfig(undefined),
			normalizeImageServiceConfig(DEFAULT_IMAGE_SERVICE),
		);
	});

	it("keeps the 'cloudflare-binding' string and compound forms distinguishable", () => {
		const asString = normalizeImageServiceConfig('cloudflare-binding');
		const asCompound = normalizeImageServiceConfig({ build: 'cloudflare-binding' });
		assert.equal(asString.buildService, asCompound.buildService);
		assert.equal(asString.runtimeService, asCompound.runtimeService);
		assert.notEqual(asString.transformAtBuild, asCompound.transformAtBuild);
	});
});

describe('setImageConfig service and endpoint selection', () => {
	const cases: Array<{
		name: string;
		input: ImageServiceConfig | undefined;
		dev: { service: string; endpoint: string | undefined };
		build: { service: string; endpoint: string | undefined };
	}> = [
		{
			name: 'undefined',
			input: undefined,
			dev: { service: WORKERD_SERVICE, endpoint: TRANSFORM_ENDPOINT },
			build: { service: WORKERD_SERVICE, endpoint: TRANSFORM_ENDPOINT },
		},
		{
			name: "'passthrough'",
			input: 'passthrough',
			dev: { service: NOOP_SERVICE, endpoint: GENERIC_ENDPOINT },
			build: { service: NOOP_SERVICE, endpoint: PASSTHROUGH_ENDPOINT },
		},
		{
			name: "'cloudflare'",
			input: 'cloudflare',
			dev: { service: NOOP_SERVICE, endpoint: GENERIC_ENDPOINT },
			build: { service: EXTERNAL_SERVICE, endpoint: undefined },
		},
		{
			name: "'cloudflare-binding'",
			input: 'cloudflare-binding',
			dev: { service: WORKERD_SERVICE, endpoint: TRANSFORM_ENDPOINT },
			build: { service: WORKERD_SERVICE, endpoint: TRANSFORM_ENDPOINT },
		},
		{
			name: "'compile'",
			input: 'compile',
			dev: { service: WORKERD_SERVICE, endpoint: TRANSFORM_ENDPOINT },
			build: { service: WORKERD_SERVICE, endpoint: PASSTHROUGH_ENDPOINT },
		},
		{
			name: "{ build: 'compile' }",
			input: { build: 'compile' },
			dev: { service: WORKERD_SERVICE, endpoint: TRANSFORM_ENDPOINT },
			build: { service: WORKERD_SERVICE, endpoint: PASSTHROUGH_ENDPOINT },
		},
		{
			name: "{ build: 'compile', runtime: 'cloudflare-binding' }",
			input: { build: 'compile', runtime: 'cloudflare-binding' },
			dev: { service: WORKERD_SERVICE, endpoint: TRANSFORM_ENDPOINT },
			build: { service: WORKERD_SERVICE, endpoint: TRANSFORM_ENDPOINT },
		},
		{
			name: "{ build: 'cloudflare-binding', runtime: 'passthrough' }",
			input: { build: 'cloudflare-binding', runtime: 'passthrough' },
			dev: { service: WORKERD_SERVICE, endpoint: TRANSFORM_ENDPOINT },
			build: { service: WORKERD_SERVICE, endpoint: PASSTHROUGH_ENDPOINT },
		},
		{
			name: "'custom'",
			input: 'custom',
			dev: { service: SHARP_SERVICE, endpoint: GENERIC_ENDPOINT },
			build: { service: SHARP_SERVICE, endpoint: undefined },
		},
	];

	for (const { name, input, dev, build } of cases) {
		it(`${name} in dev`, () => {
			const { logger } = makeLogger();
			const result = setImageConfig(input, makeImageConfig(), 'dev', logger);
			assert.equal(result.service.entrypoint, dev.service);
			assert.equal(result.endpoint?.entrypoint, dev.endpoint);
		});

		it(`${name} in build`, () => {
			const { logger } = makeLogger();
			const result = setImageConfig(input, makeImageConfig(), 'build', logger);
			assert.equal(result.service.entrypoint, build.service);
			assert.equal(result.endpoint?.entrypoint, build.endpoint);
		});
	}

	it('never leaves Sharp installed as the service unless the mode is custom', () => {
		const { logger } = makeLogger();
		for (const { input, name } of cases) {
			if (name === "'custom'") continue;
			for (const command of ['dev', 'build'] as const) {
				const result = setImageConfig(input, makeImageConfig(), command, logger);
				assert.notEqual(
					result.service.entrypoint,
					SHARP_SERVICE,
					`${name} in ${command} left Sharp as the workerd image service`,
				);
			}
		}
	});
});

describe('setImageConfig with the default and a user image service', () => {
	it('preserves a user service so it runs at build time', () => {
		const { logger } = makeLogger();
		const result = setImageConfig(undefined, makeImageConfig('my-service'), 'build', logger);
		assert.equal(result.service.entrypoint, 'my-service');
		assert.equal(result.endpoint?.entrypoint, TRANSFORM_ENDPOINT);
	});

	it('preserves a relative user service entrypoint verbatim', () => {
		const { logger } = makeLogger();
		const result = setImageConfig(
			undefined,
			makeImageConfig('./src/my-service.ts'),
			'build',
			logger,
		);
		assert.equal(result.service.entrypoint, './src/my-service.ts');
	});

	it('does not treat its own workerd stub as a user service', () => {
		const { logger } = makeLogger();
		const result = setImageConfig(undefined, makeImageConfig(WORKERD_SERVICE), 'build', logger);
		assert.equal(result.service.entrypoint, WORKERD_SERVICE);
	});

	it('replaces Astro’s default Sharp service', () => {
		const { logger } = makeLogger();
		const result = setImageConfig(undefined, makeImageConfig(SHARP_SERVICE), 'build', logger);
		assert.equal(result.service.entrypoint, WORKERD_SERVICE);
	});

	it('emits no warning for any mode other than custom-with-Sharp', () => {
		for (const input of [
			undefined,
			'passthrough',
			'cloudflare',
			'cloudflare-binding',
			'compile',
		] as const) {
			for (const command of ['dev', 'build'] as const) {
				const { logger, warnings } = makeLogger();
				setImageConfig(input, makeImageConfig(), command, logger);
				assert.deepEqual(warnings, [], `${String(input)} in ${command} warned unexpectedly`);
			}
		}
	});
});

describe('setImageConfig custom mode', () => {
	it('uses the generic endpoint in dev', () => {
		const { logger } = makeLogger();
		const result = setImageConfig('custom', makeImageConfig('my-service'), 'dev', logger);
		assert.equal(result.endpoint?.entrypoint, GENERIC_ENDPOINT);
	});

	it('respects a user-configured endpoint in dev', () => {
		const { logger } = makeLogger();
		const result = setImageConfig(
			'custom',
			makeImageConfig('my-service', 'my-endpoint'),
			'dev',
			logger,
		);
		assert.equal(result.endpoint?.entrypoint, 'my-endpoint');
	});

	it('warns in dev when the service resolves to Sharp', () => {
		const { logger, warnings } = makeLogger();
		const result = setImageConfig('custom', makeImageConfig(SHARP_SERVICE), 'dev', logger);
		assert.equal(warnings.length, 1);
		assert.ok(warnings[0].includes('Sharp image service cannot run inside the workerd runtime'));
		assert.equal(result.service.entrypoint, SHARP_SERVICE);
	});

	it('does not warn in dev for a non-Sharp service', () => {
		const { logger, warnings } = makeLogger();
		setImageConfig('custom', makeImageConfig('my-service'), 'dev', logger);
		assert.equal(warnings.length, 0);
	});

	it('does not warn or override the endpoint during build', () => {
		const { logger, warnings } = makeLogger();
		const result = setImageConfig('custom', makeImageConfig(SHARP_SERVICE), 'build', logger);
		assert.equal(warnings.length, 0);
		assert.equal(result.endpoint?.entrypoint, undefined);
	});
});
