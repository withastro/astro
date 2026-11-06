import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateConfig as _validateConfig } from '../../../dist/core/config/validate.js';
import { getImageServiceConfig } from '../../../dist/assets/utils/service-config.js';
import { runHookConfigSetup } from '../../../dist/integrations/hooks.js';
import type { AstroSettings } from '../../../dist/types/astro.js';
import { defaultLogger } from '../test-utils.ts';

const SHARP = 'astro/assets/services/sharp';

function validateConfig(userConfig: Record<string, unknown>) {
	return _validateConfig(userConfig, process.cwd(), '');
}

async function setupWithIntegration(
	userConfig: Record<string, unknown>,
	newConfig: Record<string, unknown>,
) {
	const config = await validateConfig({
		...userConfig,
		integrations: [
			{
				name: 'test',
				hooks: {
					'astro:config:setup': ({ updateConfig }: { updateConfig: (c: object) => void }) => {
						updateConfig(newConfig);
					},
				},
			},
		],
	});
	const settings = await runHookConfigSetup({
		logger: defaultLogger,
		settings: { config, dotAstroDir: new URL('./.astro/', config.root) } as AstroSettings,
	} as Parameters<typeof runHookConfigSetup>[0]);
	return settings.config.image.service;
}

function resolveTargets(service: Parameters<typeof getImageServiceConfig>[0]) {
	return {
		build: getImageServiceConfig(service, 'build'),
		runtime: getImageServiceConfig(service, 'runtime'),
	};
}

describe('image.service build and runtime services', () => {
	it('uses a single service for both targets', async () => {
		const config = await validateConfig({ image: { service: { entrypoint: 'my-service' } } });
		assert.deepEqual(config.image.service, { entrypoint: 'my-service', config: {} });
		assert.deepEqual(resolveTargets(config.image.service), {
			build: { entrypoint: 'my-service', config: {} },
			runtime: { entrypoint: 'my-service', config: {} },
		});
	});

	it('keeps { build, runtime } as written', async () => {
		const config = await validateConfig({
			image: {
				service: {
					build: { entrypoint: SHARP },
					runtime: { entrypoint: 'my-cdn', config: { a: 1 } },
				},
			},
		});
		assert.deepEqual(config.image.service, {
			build: { entrypoint: SHARP, config: {} },
			runtime: { entrypoint: 'my-cdn', config: { a: 1 } },
		});
		assert.deepEqual(resolveTargets(config.image.service), config.image.service);
	});

	it('replaces { build, runtime } with a single service set by an integration', async () => {
		const service = await setupWithIntegration(
			{ image: { service: { build: { entrypoint: SHARP }, runtime: { entrypoint: 'a' } } } },
			{ image: { service: { entrypoint: 'my-cdn' } } },
		);
		assert.deepEqual(resolveTargets(service), {
			build: { entrypoint: 'my-cdn', config: {} },
			runtime: { entrypoint: 'my-cdn', config: {} },
		});
	});

	it('replaces a single service with { build, runtime } set by an integration', async () => {
		const service = await setupWithIntegration(
			{ image: { service: { entrypoint: 'a', config: { a: 1 } } } },
			{ image: { service: { build: { entrypoint: SHARP }, runtime: { entrypoint: 'my-cdn' } } } },
		);
		assert.deepEqual(resolveTargets(service), {
			build: { entrypoint: SHARP, config: {} },
			runtime: { entrypoint: 'my-cdn', config: {} },
		});
	});

	it('merges a single service set by an integration into a single service', async () => {
		const service = await setupWithIntegration(
			{ image: { service: { entrypoint: 'a', config: { a: 1 } } } },
			{ image: { service: { entrypoint: 'my-cdn' } } },
		);
		assert.deepEqual(service, { entrypoint: 'my-cdn', config: { a: 1 } });
	});

	it('merges { build, runtime } set by an integration into { build, runtime }', async () => {
		const service = await setupWithIntegration(
			{ image: { service: { build: { entrypoint: SHARP }, runtime: { entrypoint: 'a' } } } },
			{ image: { service: { runtime: { entrypoint: 'my-cdn' } } } },
		);
		assert.deepEqual(resolveTargets(service), {
			build: { entrypoint: SHARP, config: {} },
			runtime: { entrypoint: 'my-cdn', config: {} },
		});
	});
});
