import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getOutFile, getOutFolder } from '../../../dist/core/build/common.js';
import { getOutputFilename } from '../../../dist/core/util.js';
import type { AstroSettings } from '../../../dist/types/astro.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import { createSettings } from './test-helpers.ts';

describe('status code pages output paths', () => {
	const pageRoute = { type: 'page', isIndex: false } as RouteData;

	describe('getOutFolder', () => {
		it('outputs root /404 as 404.html in directory format', () => {
			const settings = createSettings({ buildOutput: 'static' }) as unknown as AstroSettings;
			const result = getOutFolder(settings, '/404', pageRoute);
			assert.equal(result.pathname, '/project/dist/');
		});

		it('outputs nested /en/404 as en/404.html in directory format', () => {
			const settings = createSettings({ buildOutput: 'static' }) as unknown as AstroSettings;
			const result = getOutFolder(settings, '/en/404', pageRoute);
			assert.equal(result.pathname, '/project/dist/en/');
		});

		it('outputs nested /ar-ae/404 as ar-ae/404.html in directory format', () => {
			const settings = createSettings({ buildOutput: 'static' }) as unknown as AstroSettings;
			const result = getOutFolder(settings, '/ar-ae/404', pageRoute);
			assert.equal(result.pathname, '/project/dist/ar-ae/');
		});

		it('outputs root /500 as 500.html in directory format', () => {
			const settings = createSettings({ buildOutput: 'static' }) as unknown as AstroSettings;
			const result = getOutFolder(settings, '/500', pageRoute);
			assert.equal(result.pathname, '/project/dist/');
		});

		it('outputs nested /en/500 as en/500.html in directory format', () => {
			const settings = createSettings({ buildOutput: 'static' }) as unknown as AstroSettings;
			const result = getOutFolder(settings, '/en/500', pageRoute);
			assert.equal(result.pathname, '/project/dist/en/');
		});
	});

	describe('getOutFile', () => {
		it('outputs root /404 as 404.html in directory format', () => {
			const outFolder = new URL('file:///project/dist/');
			const result = getOutFile('directory', outFolder, '/404', pageRoute);
			assert.equal(result.pathname, '/project/dist/404.html');
		});

		it('outputs nested /en/404 as 404.html in directory format', () => {
			const outFolder = new URL('file:///project/dist/en/');
			const result = getOutFile('directory', outFolder, '/en/404', pageRoute);
			assert.equal(result.pathname, '/project/dist/en/404.html');
		});

		it('outputs nested /ar-ae/500 as 500.html in directory format', () => {
			const outFolder = new URL('file:///project/dist/ar-ae/');
			const result = getOutFile('directory', outFolder, '/ar-ae/500', pageRoute);
			assert.equal(result.pathname, '/project/dist/ar-ae/500.html');
		});
	});

	describe('getOutputFilename', () => {
		it('outputs root /404 as /404.html', () => {
			const result = getOutputFilename('directory', '/404', pageRoute);
			assert.equal(result, '/404.html');
		});

		it('outputs nested /en/404 as /en/404.html', () => {
			const result = getOutputFilename('directory', '/en/404', pageRoute);
			assert.equal(result, '/en/404.html');
		});

		it('outputs nested /ar-ae/500 as /ar-ae/500.html', () => {
			const result = getOutputFilename('directory', '/ar-ae/500', pageRoute);
			assert.equal(result, '/ar-ae/500.html');
		});

		it('does not affect normal pages', () => {
			const result = getOutputFilename('directory', '/about', pageRoute);
			assert.equal(result, '/about/index.html');
		});
	});
});
