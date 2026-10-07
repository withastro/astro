import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateConfig as _validateConfig } from '../../../dist/core/config/validate.js';
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

describe('image.service build and runtime services', () => {
	it('resolves a single service without a build service', async () => {
		const config = await validateConfig({ image: { service: { entrypoint: 'my-service' } } });
		assert.deepEqual(config.image.service, { entrypoint: 'my-service', config: {} });
	});

	it('resolves { build, runtime } to the runtime service with a build service', async () => {
		const config = await validateConfig({
			image: {
				service: {
					build: { entrypoint: SHARP },
					runtime: { entrypoint: 'my-cdn', config: { a: 1 } },
				},
			},
		});
		assert.deepEqual(config.image.service, {
			entrypoint: 'my-cdn',
			config: { a: 1 },
			build: { entrypoint: SHARP, config: {} },
		});
	});

	it('keeps the build service when an integration replaces the runtime service', async () => {
		const service = await setupWithIntegration(
			{ image: { service: { build: { entrypoint: SHARP }, runtime: { entrypoint: 'a' } } } },
			{ image: { service: { entrypoint: 'my-cdn' } } },
		);
		assert.equal(service.entrypoint, 'my-cdn');
		assert.equal(service.build?.entrypoint, SHARP);
	});

	it('resolves { build, runtime } set by an integration', async () => {
		const service = await setupWithIntegration(
			{},
			{ image: { service: { build: { entrypoint: SHARP }, runtime: { entrypoint: 'my-cdn' } } } },
		);
		assert.equal(service.entrypoint, 'my-cdn');
		assert.equal(service.build?.entrypoint, SHARP);
		assert.equal('runtime' in service, false);
	});
});
