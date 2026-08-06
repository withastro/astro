import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import { normalizeImageServiceConfig, setImageConfig } from '../dist/utils/image-config.js';

describe('normalizeImageServiceConfig', () => {
	it('keeps the cloudflare-binding shorthand runtime-only', () => {
		assert.deepEqual(normalizeImageServiceConfig('cloudflare-binding'), {
			buildService: 'cloudflare-binding',
			runtimeService: 'cloudflare-binding',
			transformAtBuild: false,
		});
	});

	it('opts compound cloudflare-binding config into build-time transforms', () => {
		assert.deepEqual(
			normalizeImageServiceConfig({
				build: 'cloudflare-binding',
				runtime: 'cloudflare-binding',
			}),
			{
				buildService: 'cloudflare-binding',
				runtimeService: 'cloudflare-binding',
				transformAtBuild: true,
			},
		);
	});
});

describe('setImageConfig custom mode', () => {
	function makeLogger() {
		const warnings: string[] = [];
		return {
			warnings,
			logger: { warn: (msg: string) => warnings.push(msg) } as unknown as AstroIntegrationLogger,
		};
	}

	function makeImageConfig(serviceEntrypoint: string, endpointEntrypoint?: string) {
		return {
			service: { entrypoint: serviceEntrypoint, config: {} },
			endpoint: { route: '/_image', entrypoint: endpointEntrypoint },
		} as unknown as AstroConfig['image'];
	}

	it('uses the generic endpoint in dev', () => {
		const { logger } = makeLogger();
		const result = setImageConfig('custom', makeImageConfig('my-service'), 'dev', logger);
		assert.equal(result.endpoint?.entrypoint, 'astro/assets/endpoint/generic');
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
		const result = setImageConfig(
			'custom',
			makeImageConfig('astro/assets/services/sharp'),
			'dev',
			logger,
		);
		assert.equal(warnings.length, 1);
		assert.ok(warnings[0].includes('Sharp image service cannot run inside the workerd runtime'));
		// The service is left untouched; only the endpoint is swapped.
		assert.equal(result.service.entrypoint, 'astro/assets/services/sharp');
	});

	it('does not warn in dev for a non-Sharp service', () => {
		const { logger, warnings } = makeLogger();
		setImageConfig('custom', makeImageConfig('my-service'), 'dev', logger);
		assert.equal(warnings.length, 0);
	});

	it('does not warn or override the endpoint during build', () => {
		const { logger, warnings } = makeLogger();
		const result = setImageConfig(
			'custom',
			makeImageConfig('astro/assets/services/sharp'),
			'build',
			logger,
		);
		assert.equal(warnings.length, 0);
		assert.equal(result.endpoint?.entrypoint, undefined);
	});
});
