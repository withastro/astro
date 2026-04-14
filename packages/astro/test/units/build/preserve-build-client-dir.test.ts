import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getOutFolder } from '../../../dist/core/build/common.js';
import { getClientOutputDirectory } from '../../../dist/prerender/utils.js';
import { createSettings } from './test-helpers.js';

describe('preserveBuildClientDir', () => {
	const outDir = new URL('file:///project/dist/');
	const clientDir = new URL('file:///project/dist/client/');

	describe('getClientOutputDirectory', () => {
		it('returns outDir for static builds without preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'static' });
			const result = getClientOutputDirectory(settings);
			assert.equal(result.href, outDir.href);
		});

		it('returns client dir for static builds with preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'static', preserveBuildClientDir: true });
			const result = getClientOutputDirectory(settings);
			assert.equal(result.href, clientDir.href);
		});

		it('returns client dir for server builds regardless of preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'server' });
			const result = getClientOutputDirectory(settings);
			assert.equal(result.href, clientDir.href);
		});
	});

	describe('getOutFolder', () => {
		const pageRoute = { type: 'page', isIndex: false };

		it('outputs to outDir for static builds without preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'static' });
			const result = getOutFolder(settings, '/about', pageRoute);
			assert.equal(result.href, new URL('about/', outDir).href);
		});

		it('outputs to client dir for static builds with preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'static', preserveBuildClientDir: true });
			const result = getOutFolder(settings, '/about', pageRoute);
			assert.equal(result.href, new URL('about/', clientDir).href);
		});

		it('outputs to client dir for server builds regardless of preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'server' });
			const result = getOutFolder(settings, '/about', pageRoute);
			assert.equal(result.href, new URL('about/', clientDir).href);
		});

		it('outputs root index to client dir with preserveBuildClientDir', () => {
			const settings = createSettings({ buildOutput: 'static', preserveBuildClientDir: true });
			const indexRoute = { type: 'page', isIndex: true };
			const result = getOutFolder(settings, '/', indexRoute);
			assert.equal(result.href, new URL('./', clientDir).href);
		});
	});
});
