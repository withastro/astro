import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { afterEach, describe, it } from 'node:test';
import {
	getInstalledRenderScope,
	getRenderCollectors,
	installRenderScope,
	uninstallRenderScope,
	type RenderCollectors,
	type RenderCollectorScope,
} from '../../../dist/core/render-scope/scope.js';
import { ensureAsyncRenderScope } from '../../../dist/core/render-scope/node-scope.js';

function fakeScope(): RenderCollectorScope {
	return {
		run: (_store, fn) => fn(),
		getStore: () => undefined,
	};
}

describe('render scope channel', () => {
	afterEach(() => {
		uninstallRenderScope();
	});

	it('is empty until a scope is installed', () => {
		assert.equal(getInstalledRenderScope(), undefined);
		assert.equal(getRenderCollectors(), undefined);
	});

	it('installs first-wins: a later install returns the first scope', () => {
		const first = fakeScope();
		const second = fakeScope();
		assert.equal(installRenderScope(first), first);
		assert.equal(installRenderScope(second), first);
		assert.equal(getInstalledRenderScope(), first);
	});

	it('converges two installers that both awaited an import on one scope', async () => {
		const [a, b] = await Promise.all([
			(async () => {
				await Promise.resolve();
				return installRenderScope(fakeScope());
			})(),
			(async () => {
				await Promise.resolve();
				return installRenderScope(fakeScope());
			})(),
		]);
		assert.equal(a, b);
		assert.equal(getInstalledRenderScope(), a);
	});

	it('uninstallRenderScope resets the channel', () => {
		installRenderScope(fakeScope());
		uninstallRenderScope();
		assert.equal(getInstalledRenderScope(), undefined);
	});

	it('ensureAsyncRenderScope installs an AsyncLocalStorage-backed scope first-wins', () => {
		const scope = ensureAsyncRenderScope();
		assert.ok(scope instanceof AsyncLocalStorage);
		assert.equal(ensureAsyncRenderScope(), scope);
		assert.equal(getInstalledRenderScope(), scope);
	});

	it('getRenderCollectors returns the store entered through the scope', () => {
		const scope = ensureAsyncRenderScope();
		const store: RenderCollectors = { contentEntries: new Set(), staticImages: [] };
		scope.run(store, () => {
			assert.equal(getRenderCollectors(), store);
		});
		assert.equal(getRenderCollectors(), undefined);
	});

	it('shares one scope across separately loaded copies of the module', async () => {
		// The prerender runtime is bundled, so the orchestrator and the runtime hold
		// different compiled copies of scope.ts. Simulate the second instance with a
		// query-string cache-buster and assert both copies resolve one channel.
		const copyBSpecifier = '../../../dist/core/render-scope/scope.js?render-scope-copy-b';
		const copyB = (await import(
			copyBSpecifier
		)) as typeof import('../../../dist/core/render-scope/scope.js');

		const scope = ensureAsyncRenderScope();
		assert.equal(copyB.getInstalledRenderScope(), scope);
		assert.equal(copyB.installRenderScope(fakeScope()), scope);

		// A store entered through copy A is visible through copy B.
		const store: RenderCollectors = { contentEntries: new Set(), staticImages: [] };
		scope.run(store, () => {
			assert.equal(copyB.getRenderCollectors(), store);
		});
	});
});
