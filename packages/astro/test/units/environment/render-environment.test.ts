import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	getEnvironment,
	setEnvironment,
	type RenderEnvironment,
} from '../../../dist/core/environment/index.js';
import { productionEnvironment } from '../../../dist/core/environment/production.js';
import type { SSRLoadedRenderer } from '../../../dist/types/public/internal.js';
import { createManifest } from '../app/test-helpers.ts';

describe('environment registry', () => {
	it('defaults to the production environment when nothing is registered', () => {
		const manifest = createManifest();
		assert.equal(getEnvironment(manifest), productionEnvironment);
	});

	it('returns the registered environment for a manifest', () => {
		const manifest = createManifest();
		const custom: RenderEnvironment = { ...productionEnvironment, name: 'custom' };
		setEnvironment(manifest, custom);
		assert.equal(getEnvironment(manifest), custom);
	});

	it('registration is per manifest object', () => {
		const registeredManifest = createManifest();
		const otherManifest = createManifest();
		const custom: RenderEnvironment = { ...productionEnvironment, name: 'custom' };
		setEnvironment(registeredManifest, custom);
		assert.equal(getEnvironment(registeredManifest), custom);
		assert.equal(getEnvironment(otherManifest), productionEnvironment);
	});

	it('last registration wins', () => {
		const manifest = createManifest();
		const first: RenderEnvironment = { ...productionEnvironment, name: 'first' };
		const second: RenderEnvironment = { ...productionEnvironment, name: 'second' };
		setEnvironment(manifest, first);
		setEnvironment(manifest, second);
		assert.equal(getEnvironment(manifest), second);
	});
});

describe('production environment', () => {
	it('has the production statics', () => {
		assert.equal(productionEnvironment.name, 'production');
		assert.equal(productionEnvironment.runtimeMode, 'production');
		assert.equal(productionEnvironment.errorStrategy, 'default');
		assert.equal(productionEnvironment.injectCspMetaTagsOnErrorPages, false);
		assert.equal(productionEnvironment.defaultStreaming(createManifest()), true);
	});

	it('getRenderers returns the manifest renderers array', () => {
		const renderers: SSRLoadedRenderer[] = [];
		const manifest = createManifest({ renderers });
		assert.equal(productionEnvironment.getRenderers(manifest), renderers);
	});

	it('logRequest is a no-op', () => {
		const manifest = createManifest();
		assert.equal(
			productionEnvironment.logRequest(manifest, {
				pathname: '/',
				method: 'GET',
				statusCode: 200,
				isRewrite: false,
				timeStart: 0,
			}),
			undefined,
		);
	});
});
