import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	isHandlerUsed,
	markAllHandlersUsed,
	markHandlerUsed,
} from '@astrojs/vite-plugin-router/_internal/core/fetch/features.js';
import { createManifest } from '../app/test-helpers.ts';

describe('features module', () => {
	it('reports no handler as used by default', () => {
		assert.equal(isHandlerUsed(createManifest(), 'redirects'), false);
	});

	it('records handlers by name', () => {
		const manifest = createManifest();
		markHandlerUsed(manifest, 'redirects');
		assert.equal(isHandlerUsed(manifest, 'redirects'), true);
		assert.equal(isHandlerUsed(manifest, 'actions'), false);

		markHandlerUsed(manifest, 'actions');
		assert.equal(isHandlerUsed(manifest, 'actions'), true);
	});

	it('scopes the record per manifest object', () => {
		const a = createManifest();
		const b = createManifest();
		markHandlerUsed(a, 'i18n');
		assert.equal(isHandlerUsed(a, 'i18n'), true);
		assert.equal(isHandlerUsed(b, 'i18n'), false);
	});

	it('markAllHandlersUsed marks every name, including unknown ones', () => {
		const manifest = createManifest();
		markAllHandlersUsed(manifest);
		assert.equal(isHandlerUsed(manifest, 'sessions'), true);
		assert.equal(isHandlerUsed(manifest, 'my-feature'), true);
	});
});
