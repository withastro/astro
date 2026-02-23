import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Router } from '../../../dist/core/routing/router.js';
import { dynamicPart, makeRoute, staticPart } from './test-helpers.js';

describe('preview routing (unit)', () => {
	const routes = (trailingSlash) => [
		makeRoute({ segments: [], trailingSlash, route: '/', pathname: '/', isIndex: true }),
		makeRoute({
			segments: [[staticPart('another')]],
			trailingSlash,
			route: '/another',
			pathname: '/another',
		}),
		makeRoute({
			segments: [[dynamicPart('id')]],
			trailingSlash,
			route: '/[id]',
			pathname: undefined,
		}),
	];

	it('matches base with trailingSlash=always', () => {
		const router = new Router(routes('always'), {
			base: '/blog',
			trailingSlash: 'always',
			buildFormat: 'directory',
		});

		assert.equal(router.match('/blog/').type, 'match');
		assert.equal(router.match('/blog').type, 'redirect');
		assert.equal(router.match('/blog/another/').type, 'match');
		assert.equal(router.match('/blog/another').type, 'none');
	});

	it('matches base with trailingSlash=never', () => {
		const router = new Router(routes('never'), {
			base: '/blog',
			trailingSlash: 'never',
			buildFormat: 'directory',
		});

		assert.equal(router.match('/blog').type, 'match');
		assert.equal(router.match('/blog/').type, 'redirect');
		assert.equal(router.match('/blog/another').type, 'match');
		assert.equal(router.match('/blog/another/').type, 'none');
	});

	it('matches base with trailingSlash=ignore', () => {
		const router = new Router(routes('ignore'), {
			base: '/blog',
			trailingSlash: 'ignore',
			buildFormat: 'directory',
		});

		assert.equal(router.match('/blog').type, 'match');
		assert.equal(router.match('/blog/').type, 'match');
		assert.equal(router.match('/blog/another').type, 'match');
		assert.equal(router.match('/blog/another/').type, 'match');
	});

	it('accepts .html paths when buildFormat=file', () => {
		const router = new Router(routes('ignore'), {
			base: '/blog',
			trailingSlash: 'ignore',
			buildFormat: 'file',
		});

		assert.equal(router.match('/blog/index.html').type, 'match');
		assert.equal(router.match('/blog/another.html').type, 'match');
		const match = router.match('/blog/1.html');
		assert.equal(match.type, 'match');
		assert.deepEqual(match.params, { id: '1' });
	});
});
