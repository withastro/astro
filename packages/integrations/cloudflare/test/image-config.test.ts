import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import { setImageConfig } from '../src/utils/image-config.ts';

const SHARP_ENTRYPOINT = 'astro/assets/services/sharp';
const CUSTOM_ENTRYPOINT = 'my-app/image-services/cdn';
const WORKERD_ENTRYPOINT = '@astrojs/cloudflare/image-service-workerd';

function createNoopLogger(): AstroIntegrationLogger {
	const noop = () => {};
	const logger = {
		options: {} as never,
		label: 'test',
		fork: () => logger,
		info: noop,
		warn: noop,
		error: noop,
		debug: noop,
	};
	return logger as unknown as AstroIntegrationLogger;
}

function makeConfig(entrypoint: string): AstroConfig['image'] {
	return { service: { entrypoint, config: {} } } as AstroConfig['image'];
}

describe('setImageConfig — custom image service preservation', () => {
	for (const mode of [
		undefined, // default → 'cloudflare-binding'
		'passthrough',
		'cloudflare',
		'cloudflare-binding',
		'compile',
		{ build: 'compile' as const },
		{ build: 'compile' as const, runtime: 'cloudflare-binding' as const },
	]) {
		it(`preserves a user-defined service when imageService = ${JSON.stringify(mode)}`, () => {
			const customConfig = makeConfig(CUSTOM_ENTRYPOINT);
			const result = setImageConfig(mode as any, customConfig, 'build', createNoopLogger());
			assert.equal(
				result.service.entrypoint,
				CUSTOM_ENTRYPOINT,
				`Expected custom service to be preserved for mode ${JSON.stringify(mode)}`,
			);
		});
	}

	it("does not preserve when user has the default sharp service (mode 'cloudflare-binding')", () => {
		const sharpConfig = makeConfig(SHARP_ENTRYPOINT);
		const result = setImageConfig('cloudflare-binding', sharpConfig, 'build', createNoopLogger());
		assert.equal(
			result.service.entrypoint,
			WORKERD_ENTRYPOINT,
			'Expected adapter to override default sharp for cloudflare-binding mode',
		);
	});

	it("does not preserve when user has the default sharp service (mode 'compile')", () => {
		const sharpConfig = makeConfig(SHARP_ENTRYPOINT);
		const result = setImageConfig('compile', sharpConfig, 'build', createNoopLogger());
		assert.equal(
			result.service.entrypoint,
			WORKERD_ENTRYPOINT,
			'Expected adapter to override default sharp for compile mode',
		);
	});

	it("respects an explicit 'custom' mode regardless of service", () => {
		const customConfig = makeConfig(CUSTOM_ENTRYPOINT);
		const result = setImageConfig('custom', customConfig, 'build', createNoopLogger());
		assert.equal(result.service.entrypoint, CUSTOM_ENTRYPOINT);
	});
});
