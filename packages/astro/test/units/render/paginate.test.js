// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generatePaginateFunction } from '../../../dist/core/render/paginate.js';
import { createRouteData } from '../mocks.js';

const items = Array.from({ length: 25 }, (_, i) => `item-${i + 1}`);

describe('Pagination — optional root page (spread route)', () => {
	const route = createRouteData({
		route: '/posts/optional-root-page/[...page]',
		params: ['...page'],
		segments: [
			[{ content: 'posts', dynamic: false, spread: false }],
			[{ content: 'optional-root-page', dynamic: false, spread: false }],
			[{ content: '...page', dynamic: true, spread: true }],
		],
	});
	const paginate = generatePaginateFunction(route, '/blog', 'ignore');
	const pages = paginate(items, { pageSize: 10 });

	it('generates 3 pages for 25 items with pageSize 10', () => {
		assert.equal(pages.length, 3);
	});

	it('page 1 has page param undefined (no number in URL)', () => {
		assert.equal(pages[0].params.page, undefined);
	});

	it('page 2 has page param "2"', () => {
		assert.equal(pages[1].params.page, '2');
	});

	it('page 3 has page param "3"', () => {
		assert.equal(pages[2].params.page, '3');
	});

	it('generates correct output paths', () => {
		// page 1 has no number → /blog/posts/optional-root-page/
		assert.ok(pages[0].params.page === undefined);
		// page 2 → /posts/optional-root-page/2
		assert.ok(pages[1].props.page.url.current.includes('optional-root-page/2'));
		// page 3 → /posts/optional-root-page/3
		assert.ok(pages[2].props.page.url.current.includes('optional-root-page/3'));
	});
});

describe('Pagination — named root page (non-spread route)', () => {
	// Non-spread route => page 1 has page param "1" (always included)
	const route = createRouteData({
		route: '/posts/named-root-page/[page]',
		params: ['page'],
		segments: [
			[{ content: 'posts', dynamic: false, spread: false }],
			[{ content: 'named-root-page', dynamic: false, spread: false }],
			[{ content: 'page', dynamic: true, spread: false }],
		],
	});
	const paginate = generatePaginateFunction(route, '/blog', 'ignore');
	const pages = paginate(items, { pageSize: 10 });

	it('generates 3 pages for 25 items with pageSize 10', () => {
		assert.equal(pages.length, 3);
	});

	it('page 1 has page param "1" (number always included)', () => {
		assert.equal(pages[0].params.page, '1');
	});

	it('page 2 has page param "2"', () => {
		assert.equal(pages[1].params.page, '2');
	});

	it('generates correct output paths including /1/', () => {
		assert.ok(pages[0].props.page.url.current.includes('named-root-page/1'));
		assert.ok(pages[1].props.page.url.current.includes('named-root-page/2'));
		assert.ok(pages[2].props.page.url.current.includes('named-root-page/3'));
	});
});

describe('Pagination — multiple params (color + page)', () => {
	// Each color has its own set of pages; base='/blog', trailingSlash='never'
	const route = createRouteData({
		route: '/posts/[color]/[page]',
		params: ['color', 'page'],
		segments: [
			[{ content: 'posts', dynamic: false, spread: false }],
			[{ content: 'color', dynamic: true, spread: false }],
			[{ content: 'page', dynamic: true, spread: false }],
		],
	});
	const paginate = generatePaginateFunction(route, '/blog', 'never');

	const redItems = ['r1', 'r2', 'r3'];
	const blueItems = Array.from({ length: 15 }, (_, i) => `b${i + 1}`);

	const redPages = paginate(redItems, { pageSize: 10, params: { color: 'red' } });
	const bluePages = paginate(blueItems, { pageSize: 10, params: { color: 'blue' } });

	it('red has 1 page (3 items, pageSize 10)', () => {
		assert.equal(redPages.length, 1);
	});

	it('blue has 2 pages (15 items, pageSize 10)', () => {
		assert.equal(bluePages.length, 2);
	});

	it('red page 1: no prev, no next', () => {
		const { url } = redPages[0].props.page;
		assert.equal(url.prev, undefined);
		assert.equal(url.next, undefined);
	});

	it('blue page 1: no prev, next points to page 2', () => {
		const { url } = bluePages[0].props.page;
		assert.equal(url.prev, undefined);
		assert.ok(
			url.next?.includes('/blog/posts/blue/2'),
			`expected /blog/posts/blue/2, got ${url.next}`,
		);
	});

	it('blue page 2: prev points to page 1, no next', () => {
		const { url } = bluePages[1].props.page;
		assert.ok(
			url.prev?.includes('/blog/posts/blue/1'),
			`expected /blog/posts/blue/1, got ${url.prev}`,
		);
		assert.equal(url.next, undefined);
	});

	it('page data contains correct currentPage, data slice, and filter param', () => {
		assert.equal(redPages[0].props.page.currentPage, 1);
		assert.equal(redPages[0].params.color, 'red');
		assert.equal(bluePages[1].props.page.currentPage, 2);
		assert.equal(bluePages[1].params.color, 'blue');
	});
});

describe('Pagination — root spread, correct prev URL — Migrated from astro-pagination-root-spread.test.js', () => {
	// 4 items, pageSize 1 → 4 pages; root spread means page 1 has no number in URL.
	const route = createRouteData({
		route: '/[...page]',
		params: ['...page'],
		segments: [[{ content: '...page', dynamic: true, spread: true }]],
	});
	const paginate = generatePaginateFunction(route, '/blog', 'ignore');
	const astronauts = [
		{ astronaut: 'Neil Armstrong' },
		{ astronaut: 'Buzz Aldrin' },
		{ astronaut: 'Sally Ride' },
		{ astronaut: 'John Glenn' },
	];
	const pages = paginate(astronauts, { pageSize: 1 });

	it('generates 4 pages', () => {
		assert.equal(pages.length, 4);
	});

	it('page 1 (root): no prev', () => {
		assert.equal(pages[0].props.page.url.prev, undefined);
	});

	it('page 2: prev is /blog/', () => {
		// page 1 has no number in URL → its url.current is /blog/
		assert.ok(
			pages[1].props.page.url.prev?.endsWith('/blog/') || pages[1].props.page.url.prev === '/blog/',
			`got ${pages[1].props.page.url.prev}`,
		);
	});

	it('page 3: prev is /blog/2', () => {
		assert.ok(
			pages[2].props.page.url.prev?.includes('/blog/2'),
			`got ${pages[2].props.page.url.prev}`,
		);
	});

	it('page 4: prev is /blog/3', () => {
		assert.ok(
			pages[3].props.page.url.prev?.includes('/blog/3'),
			`got ${pages[3].props.page.url.prev}`,
		);
	});
});
