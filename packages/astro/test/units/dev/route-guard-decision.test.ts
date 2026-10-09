import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	evaluateRouteGuard,
	type RouteGuardFsInfo,
} from '../../../dist/vite-plugin-astro-server/route-guard.js';

const NO_FILES: RouteGuardFsInfo = {
	existsInPublic: false,
	existsInSrc: false,
	existsAtRootAsFile: false,
};

// #region non-HTML requests pass through
describe('evaluateRouteGuard — non-HTML requests', () => {
	it('passes through requests without text/html accept', () => {
		const result = evaluateRouteGuard('/README.md', 'application/json', {
			...NO_FILES,
			existsAtRootAsFile: true,
		});
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through image requests', () => {
		const result = evaluateRouteGuard('/logo.png', 'image/*', {
			...NO_FILES,
			existsAtRootAsFile: true,
		});
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through requests with empty accept header', () => {
		const result = evaluateRouteGuard('/README.md', '', {
			...NO_FILES,
			existsAtRootAsFile: true,
		});
		assert.deepEqual(result, { action: 'next' });
	});
});
// #endregion

// #region Vite internal prefixes
describe('evaluateRouteGuard — Vite internal prefixes', () => {
	it('passes through /@vite/client', () => {
		const result = evaluateRouteGuard('/@vite/client', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through /@fs/ paths', () => {
		const result = evaluateRouteGuard('/@fs/project/src/main.ts', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through /@id/ paths', () => {
		const result = evaluateRouteGuard('/@id/module', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through /__vite paths', () => {
		const result = evaluateRouteGuard('/__vite/hmr', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through /@react-refresh', () => {
		const result = evaluateRouteGuard('/@react-refresh', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through /node_modules/ paths', () => {
		const result = evaluateRouteGuard('/node_modules/foo/bar.js', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through /.astro/ paths', () => {
		const result = evaluateRouteGuard('/.astro/types.d.ts', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});
});
// #endregion

// #region query params
describe('evaluateRouteGuard — query params', () => {
	it('passes through URLs with query params', () => {
		const result = evaluateRouteGuard('/README.md?raw', 'text/html', {
			...NO_FILES,
			existsAtRootAsFile: true,
		});
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through URLs with ?url transform', () => {
		const result = evaluateRouteGuard('/style.css?url', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});
});
// #endregion

// #region public and src directory files
describe('evaluateRouteGuard — public and src files', () => {
	it('passes through files that exist in publicDir', () => {
		const result = evaluateRouteGuard('/robots.txt', 'text/html', {
			existsInPublic: true,
			existsInSrc: false,
			existsAtRootAsFile: false,
		});
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through files that exist in srcDir', () => {
		const result = evaluateRouteGuard('/pages/index.astro', 'text/html', {
			existsInPublic: false,
			existsInSrc: true,
			existsAtRootAsFile: false,
		});
		assert.deepEqual(result, { action: 'next' });
	});

	it('public takes precedence even when root file exists', () => {
		const result = evaluateRouteGuard('/robots.txt', 'text/html', {
			existsInPublic: true,
			existsInSrc: false,
			existsAtRootAsFile: true,
		});
		assert.deepEqual(result, { action: 'next' });
	});
});
// #endregion

// #region blocking root files
describe('evaluateRouteGuard — blocking root files', () => {
	it('blocks README.md that exists only at root', () => {
		const result = evaluateRouteGuard('/README.md', 'text/html', {
			existsInPublic: false,
			existsInSrc: false,
			existsAtRootAsFile: true,
		});
		assert.equal(result.action, 'block');
		if (result.action === 'block') {
			assert.equal(result.pathname, '/README.md');
		}
	});

	it('blocks LICENSE that exists only at root', () => {
		const result = evaluateRouteGuard('/LICENSE', 'text/html', {
			existsInPublic: false,
			existsInSrc: false,
			existsAtRootAsFile: true,
		});
		assert.equal(result.action, 'block');
		if (result.action === 'block') {
			assert.equal(result.pathname, '/LICENSE');
		}
	});

	it('blocks package.json that exists only at root', () => {
		const result = evaluateRouteGuard('/package.json', 'text/html', {
			existsInPublic: false,
			existsInSrc: false,
			existsAtRootAsFile: true,
		});
		assert.equal(result.action, 'block');
		if (result.action === 'block') {
			assert.equal(result.pathname, '/package.json');
		}
	});
});
// #endregion

// #region directories at root are not blocked
describe('evaluateRouteGuard — directories at root', () => {
	it('passes through when root path is a directory (not a file)', () => {
		const result = evaluateRouteGuard('/test', 'text/html', {
			existsInPublic: false,
			existsInSrc: false,
			existsAtRootAsFile: false, // directory, not file
		});
		assert.deepEqual(result, { action: 'next' });
	});
});
// #endregion

// #region nonexistent files pass through
describe('evaluateRouteGuard — nonexistent files', () => {
	it('passes through when file does not exist anywhere', () => {
		const result = evaluateRouteGuard('/does-not-exist', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through for paths with .md extension that do not exist', () => {
		const result = evaluateRouteGuard('/nonexistent.md', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});
});
// #endregion

// #region malformed URI
describe('evaluateRouteGuard — malformed URI', () => {
	it('passes through malformed URIs', () => {
		const result = evaluateRouteGuard('/%E0%A4%A', 'text/html', NO_FILES);
		assert.deepEqual(result, { action: 'next' });
	});
});
// #endregion

// #region accept header variations
describe('evaluateRouteGuard — accept header variations', () => {
	it('blocks when accept includes text/html among others', () => {
		const result = evaluateRouteGuard('/README.md', 'text/html,application/xhtml+xml,*/*', {
			existsInPublic: false,
			existsInSrc: false,
			existsAtRootAsFile: true,
		});
		assert.equal(result.action, 'block');
	});
});
// #endregion
