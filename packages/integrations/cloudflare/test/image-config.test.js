import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	expandPreset,
	normalizeImageServiceConfig,
	resolveEndpoint,
	setImageConfig,
} from '../dist/utils/image-config.js';

describe('expandPreset', () => {
	it('cloudflare → external for build+runtime, sharp for dev', () => {
		const result = expandPreset('cloudflare');
		assert.equal(result.buildService.entrypoint, '@astrojs/cloudflare/image-service');
		assert.equal(result.devService.entrypoint, 'astro/assets/services/sharp');
		assert.equal(result.runtimeService.entrypoint, '@astrojs/cloudflare/image-service');
	});

	it('cloudflare-binding → all three use workerd stub', () => {
		const result = expandPreset('cloudflare-binding');
		const expected = '@astrojs/cloudflare/image-service-workerd';
		assert.equal(result.buildService.entrypoint, expected);
		assert.equal(result.devService.entrypoint, expected);
		assert.equal(result.runtimeService.entrypoint, expected);
	});

	it('compile → workerd build, sharp dev, passthrough runtime, transformsAtBuild flag', () => {
		const result = expandPreset('compile');
		assert.equal(result.buildService.entrypoint, '@astrojs/cloudflare/image-service-workerd');
		assert.equal(result.devService.entrypoint, 'astro/assets/services/sharp');
		assert.equal(result.runtimeService.entrypoint, 'astro/assets/services/noop');
		assert.equal(result.transformsAtBuild, true);
	});

	it('passthrough → all three use noop', () => {
		const result = expandPreset('passthrough');
		const expected = 'astro/assets/services/noop';
		assert.equal(result.buildService.entrypoint, expected);
		assert.equal(result.devService.entrypoint, expected);
		assert.equal(result.runtimeService.entrypoint, expected);
	});

	it('unknown preset throws', () => {
		assert.throws(() => expandPreset('nope'), /Unknown image service preset/);
	});
});

describe('normalizeImageServiceConfig', () => {
	it('undefined → cloudflare-binding default', () => {
		const result = normalizeImageServiceConfig(undefined);
		const expected = '@astrojs/cloudflare/image-service-workerd';
		assert.equal(result.buildService.entrypoint, expected);
		assert.equal(result.devService.entrypoint, expected);
		assert.equal(result.runtimeService.entrypoint, expected);
	});

	it('bare entrypoint string → auto-detects compile mode', () => {
		const result = normalizeImageServiceConfig('my-custom-image-service');
		assert.equal(result.buildService.entrypoint, '@astrojs/cloudflare/image-service-workerd');
		assert.equal(result.devService.entrypoint, 'my-custom-image-service');
		assert.equal(result.runtimeService.entrypoint, 'astro/assets/services/noop');
		assert.equal(result.transformsAtBuild, true);
		assert.equal(result.serviceEntrypoint, 'my-custom-image-service');
	});

	it('"custom" string → workerd stub build, sharp dev, passthrough placeholder runtime, runtimeServiceFromConfig flag', () => {
		const result = normalizeImageServiceConfig('custom');
		assert.equal(result.buildService.entrypoint, '@astrojs/cloudflare/image-service-workerd');
		assert.equal(result.devService.entrypoint, 'astro/assets/services/sharp');
		assert.equal(result.runtimeService.entrypoint, 'astro/assets/services/noop'); // placeholder
		assert.equal(result.transformsAtBuild, true);
		assert.equal(result.runtimeServiceFromConfig, true);
	});

	it('bare "sharp" string → throws, use compile preset instead', () => {
		assert.throws(() => normalizeImageServiceConfig('sharp'), /Use imageService: 'compile'/);
	});

	it('bare workerd-compatible string → no compile', () => {
		const result = normalizeImageServiceConfig('@astrojs/cloudflare/image-service');
		assert.equal(result.buildService.entrypoint, '@astrojs/cloudflare/image-service');
		assert.equal(result.runtimeService.entrypoint, '@astrojs/cloudflare/image-service');
		assert.equal(result.transformsAtBuild, false);
	});

	it('{ entrypoint } shorthand → same as bare string', () => {
		const shorthand = normalizeImageServiceConfig({ entrypoint: './src/custom.ts' });
		const bare = normalizeImageServiceConfig('./src/custom.ts');
		assert.deepEqual(shorthand, bare);
	});

	it('{ entrypoint, config } shorthand → config flows to devService and buildService stub', () => {
		const result = normalizeImageServiceConfig({
			entrypoint: './src/custom.ts',
			config: { quality: 80 },
		});
		assert.equal(result.devService.entrypoint, './src/custom.ts');
		assert.deepEqual(result.devService.config, { quality: 80 });
		assert.equal(result.buildService.entrypoint, '@astrojs/cloudflare/image-service-workerd');
		assert.deepEqual(result.buildService.config, { quality: 80 });
		assert.equal(result.transformsAtBuild, true);
		assert.equal(result.serviceEntrypoint, './src/custom.ts');
	});

	it('{ entrypoint: "sharp" } shorthand → throws, use compile preset instead', () => {
		assert.throws(
			() => normalizeImageServiceConfig({ entrypoint: 'sharp' }),
			/Use imageService: 'compile'/,
		);
	});

	it('{ entrypoint: preset } shorthand → throws, use preset directly', () => {
		assert.throws(
			() => normalizeImageServiceConfig({ entrypoint: 'cloudflare' }),
			/Presets should be passed directly/,
		);
	});

	it('{ entrypoint } with workerd-compatible service → no compile', () => {
		const result = normalizeImageServiceConfig({
			entrypoint: 'astro/assets/services/noop',
		});
		assert.equal(result.buildService.entrypoint, 'astro/assets/services/noop');
		assert.equal(result.runtimeService.entrypoint, 'astro/assets/services/noop');
		assert.equal(result.transformsAtBuild, false);
	});

	it('{ build, dev, runtime } with workerd-compatible build → no compile', () => {
		const result = normalizeImageServiceConfig({
			build: '@astrojs/cloudflare/image-service-workerd',
			dev: '@astrojs/cloudflare/image-service-workerd',
			runtime: 'passthrough',
		});
		assert.equal(result.buildService.entrypoint, '@astrojs/cloudflare/image-service-workerd');
		assert.equal(result.transformsAtBuild, false);
	});

	it('{ build, dev, runtime } with custom build → infers compile mode', () => {
		const result = normalizeImageServiceConfig({
			build: 'my-custom-image-service',
			dev: 'my-custom-image-service',
			runtime: 'passthrough',
		});
		assert.equal(result.buildService.entrypoint, '@astrojs/cloudflare/image-service-workerd');
		assert.equal(result.devService.entrypoint, 'my-custom-image-service');
		assert.equal(result.transformsAtBuild, true);
		assert.equal(result.serviceEntrypoint, 'my-custom-image-service');
	});

	it('{ entrypoint, config } slot merges config into resolved service', () => {
		const result = normalizeImageServiceConfig({
			build: { entrypoint: 'my-custom-image-service', config: { quality: 80 } },
			dev: { entrypoint: 'sharp', config: { quality: 90 } },
			runtime: 'passthrough',
		});
		assert.equal(result.serviceEntrypoint, 'my-custom-image-service');
		assert.equal(result.devService.entrypoint, 'astro/assets/services/sharp');
		assert.deepEqual(result.devService.config, { quality: 90 });
		// Build service config survives the workerd stub swap so Astro
		// can pass it through imageConfig → transform() at build time.
		assert.deepEqual(result.buildService.config, { quality: 80 });
	});

	it('"compile" as slot value throws', () => {
		assert.throws(
			() => normalizeImageServiceConfig({ build: 'compile', dev: 'sharp', runtime: 'passthrough' }),
			/preset, not a service/,
		);
	});

	it('transformAtBuild: true → forces compile mode even for workerd-compatible service', () => {
		const result = normalizeImageServiceConfig({
			build: '@astrojs/cloudflare/image-service-workerd',
			dev: '@astrojs/cloudflare/image-service-workerd',
			runtime: 'passthrough',
			transformAtBuild: true,
		});
		assert.equal(result.transformsAtBuild, true);
		assert.equal(
			result.serviceEntrypoint,
			'@astrojs/cloudflare/image-service-workerd',
		);
		// Build service swapped to workerd stub
		assert.equal(
			result.buildService.entrypoint,
			'@astrojs/cloudflare/image-service-workerd',
		);
	});

	it('transformAtBuild: false → disables compile mode for custom service', () => {
		const result = normalizeImageServiceConfig({
			build: 'my-custom-image-service',
			dev: 'my-custom-image-service',
			runtime: 'passthrough',
			transformAtBuild: false,
		});
		assert.equal(result.transformsAtBuild, false);
		assert.equal(result.serviceEntrypoint, undefined);
		// Build service used directly — no workerd stub swap
		assert.equal(result.buildService.entrypoint, 'my-custom-image-service');
	});

	it('transformAtBuild: undefined → auto-detects from entrypoint', () => {
		const result = normalizeImageServiceConfig({
			build: 'my-custom-image-service',
			dev: 'my-custom-image-service',
			runtime: 'passthrough',
		});
		assert.equal(result.transformsAtBuild, true);
		assert.equal(result.serviceEntrypoint, 'my-custom-image-service');
	});
});

describe('resolveEndpoint', () => {
	it('workerd stub → binding endpoint', () => {
		const result = resolveEndpoint({ entrypoint: '@astrojs/cloudflare/image-service-workerd' });
		assert.equal(result.entrypoint, '@astrojs/cloudflare/image-transform-endpoint');
	});

	it('any other service → generic endpoint', () => {
		assert.equal(
			resolveEndpoint({ entrypoint: 'astro/assets/services/noop' }).entrypoint,
			'astro/assets/endpoint/generic',
		);
		assert.equal(
			resolveEndpoint({ entrypoint: './custom.ts' }).entrypoint,
			'astro/assets/endpoint/generic',
		);
	});
});

describe('setImageConfig', () => {
	const baseConfig = {
		service: { entrypoint: 'astro/assets/services/sharp' },
		endpoint: { entrypoint: 'astro/assets/endpoint/node' },
	};

	const mockLogger = {
		warn: () => {},
		info: () => {},
		error: () => {},
		debug: () => {},
		label: 'test',
	};

	it('dev command → uses devService for service', () => {
		const normalized = expandPreset('compile');
		const result = setImageConfig(normalized, baseConfig, 'dev', mockLogger);
		assert.equal(result.service.entrypoint, 'astro/assets/services/sharp');
	});

	it('build command → uses buildService for service, runtimeService for endpoint', () => {
		const normalized = expandPreset('compile');
		const result = setImageConfig(normalized, baseConfig, 'build', mockLogger);
		assert.equal(result.service.entrypoint, '@astrojs/cloudflare/image-service-workerd');
		assert.equal(result.endpoint.entrypoint, 'astro/assets/endpoint/generic');
	});

	it('dev with cloudflare-binding → uses binding endpoint', () => {
		const normalized = expandPreset('cloudflare-binding');
		const result = setImageConfig(normalized, baseConfig, 'dev', mockLogger);
		assert.equal(result.endpoint.entrypoint, '@astrojs/cloudflare/image-transform-endpoint');
	});

	it('sharp as runtime service → warns and auto-switches to passthrough', () => {
		let warned = false;
		const warningLogger = {
			...mockLogger,
			warn: (msg) => {
				warned = true;
				assert.ok(msg.includes('Sharp cannot run'));
			},
		};
		const normalized = {
			buildService: { entrypoint: 'astro/assets/services/sharp' },
			devService: { entrypoint: 'astro/assets/services/sharp' },
			runtimeService: { entrypoint: 'astro/assets/services/sharp' },
			transformsAtBuild: false,
		};
		setImageConfig(normalized, baseConfig, 'build', warningLogger);
		assert.ok(warned);
	});

	// TODO: remove when 'custom' preset is removed
	it('runtimeServiceFromConfig → uses config.service at runtime', () => {
		const normalized = normalizeImageServiceConfig('custom');
		const customConfig = {
			service: { entrypoint: 'my-custom-runtime-service' },
			endpoint: { entrypoint: 'astro/assets/endpoint/node' },
		};
		const result = setImageConfig(normalized, customConfig, 'build', mockLogger);
		assert.equal(result.endpoint.entrypoint, 'astro/assets/endpoint/generic');
	});
});
