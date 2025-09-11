import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Tracing Integration', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	const events = (globalThis[Symbol.for('astro.tracing.test')] = []);

	beforeEach(() => {
		events.length = 0;
	});

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/tracing-integration/',
		});
	});

	describe('Development mode tracing', () => {
		let devServer;
		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should trace route rendering', async () => {
			const response = await fixture.fetch('/');
			assert.equal(response.status, 200);

			const eventCount = {};
			events.forEach((e) => {
				eventCount[e.event] = (eventCount[e.event] || 0) + 1;
			});

			assert.deepStrictEqual(eventCount, {
				routeRender: 1,
				middleware: 2,
				componentFrontmatter: 1,
			});

			const routeEvents = events.filter((e) => e.event === 'routeRender');
			assert.equal(routeEvents.length, 1, 'Should render a single route');

			const routeEvent = routeEvents[0];
			assert.equal(routeEvent.payload.pathname, '/');
			assert.ok(routeEvent.payload.request);
			assert.ok(routeEvent.payload.url);
			assert.ok(routeEvent.payload.routeData);
		});

		it('should trace component instantiation and rendering', async () => {
			const response = await fixture.fetch('/component-test');
			assert.equal(response.status, 200);

			const eventCount = {};
			events.forEach((e) => {
				eventCount[e.event] = (eventCount[e.event] || 0) + 1;
			});

			assert.deepStrictEqual(eventCount, {
				routeRender: 1,
				middleware: 2,
				componentFrontmatter: 7,
				instantiateComponent: 6,
				componentRender: 6,
				slotRender: 1,
			});
		});

		it('should trace slot rendering', async () => {
			const response = await fixture.fetch('/slots-test');
			assert.equal(response.status, 200);

			const eventCount = {};
			events.forEach((e) => {
				eventCount[e.event] = (eventCount[e.event] || 0) + 1;
			});

			assert.deepStrictEqual(eventCount, {
				routeRender: 1,
				middleware: 2,
				componentFrontmatter: 14,
				instantiateComponent: 18,
				componentRender: 18,
				slotRender: 13,
			});

			const slotEvents = events
				.filter((e) => e.event === 'slotRender')
				.filter((e) => e.payload.slotName === 'default');

			assert.ok(slotEvents.length > 0, 'Should have default slot events');
		});
	});

	describe('Build mode tracing', () => {
		it('should trace during static build', async () => {
			await fixture.build();

			const routeEvents = events.filter((e) => e.event === 'routeRender');
			assert.equal(routeEvents.length, 4, 'Should have one route render for each route');

			routeEvents.forEach((event) => {
				assert.ok(event.payload.request, 'Should have request object');
				assert.ok(event.payload.url, 'Should have URL object');
				assert.ok(event.payload.pathname, 'Should have pathname');
				assert.ok(event.payload.routeData, 'Should have route data');
			});

			const componentEvents = events.filter(
				(e) => e.event === 'instantiateComponent' || e.event === 'componentRender',
			);
			assert.ok(componentEvents.length > 0, 'Should have component events during build');
		});
	});
});
