import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pluginEsbuildCheck } from '../../../dist/core/build/plugins/plugin-esbuild-check.js';

function runBuildStart(build: Record<string, unknown>, canResolveEsbuild: boolean) {
	const plugin = pluginEsbuildCheck(() => canResolveEsbuild);
	const buildStart = plugin.buildStart as (this: unknown) => void;
	buildStart.call({ environment: { config: { build } } });
}

describe('pluginEsbuildCheck', () => {
	it('throws MissingEsbuild when cssMinify is esbuild and esbuild is not installed', () => {
		assert.throws(
			() => runBuildStart({ cssMinify: 'esbuild', minify: true }, false),
			(err: any) => {
				assert.equal(err.name, 'MissingEsbuild');
				assert.match(err.message, /vite\.build\.cssMinify: 'esbuild'/);
				return true;
			},
		);
	});

	it('throws MissingEsbuild when minify is esbuild and esbuild is not installed', () => {
		assert.throws(
			() => runBuildStart({ cssMinify: true, minify: 'esbuild' }, false),
			(err: any) => {
				assert.equal(err.name, 'MissingEsbuild');
				assert.match(err.message, /vite\.build\.minify: 'esbuild'/);
				return true;
			},
		);
	});

	it('does not throw when esbuild is installed', () => {
		assert.doesNotThrow(() => runBuildStart({ cssMinify: 'esbuild', minify: 'esbuild' }, true));
	});

	it('does not check for esbuild when no esbuild minifier is configured', () => {
		assert.doesNotThrow(() => runBuildStart({ cssMinify: true, minify: 'oxc' }, false));
	});
});
