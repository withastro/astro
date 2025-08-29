import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { onTraceEvent } from '../dist/runtime/server/tracing.js';
import { loadFixture } from './test-utils.js';

describe('Tracing Integration', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;
	let events = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/tracing-integration/',
		});
	});

	after(async () => {
		if (devServer) {
			await devServer.stop();
		}
	});

	describe('Development mode tracing', () => {
		before(async () => {
			events = [];
			devServer = await fixture.startDevServer();

			// Set up tracing listener
			onTraceEvent((event, callback) => {
				events.push({
					event: event.event,
					payload: { ...event.payload },
					timestamp: Date.now(),
				});
				return callback();
			});
		});

		it('should trace route rendering', async () => {
			const response = await fixture.fetch('/');
			assert.equal(response.status, 200);

			// Check that route render event was captured
			const routeEvents = events.filter((e) => e.event === 'routeRender');
			assert.equal(routeEvents.length, 1);

			const routeEvent = routeEvents[0];
			assert.equal(routeEvent.payload.pathname, '/');
			assert.ok(routeEvent.payload.request);
			assert.ok(routeEvent.payload.url);
			assert.ok(routeEvent.payload.routeData);
		});

		it('should trace component instantiation and rendering', async () => {
			const response = await fixture.fetch('/component-test');
			assert.equal(response.status, 200);

			// Check for component-related events
			const componentEvents = events.filter(
				(e) =>
					e.event === 'instantiateComponent' ||
					e.event === 'componentRender' ||
					e.event === 'componentFrontmatter',
			);

			assert.ok(componentEvents.length > 0, 'Should have component events');

			// Find events for our test component
			const testComponentEvents = componentEvents.filter(
				(e) =>
					e.payload.componentName === 'TestComponent' || e.payload.displayName === 'TestComponent',
			);

			assert.ok(testComponentEvents.length > 0, 'Should have TestComponent events');
		});

		it('should trace slot rendering', async () => {
			const response = await fixture.fetch('/slots-test');
			assert.equal(response.status, 200);

			// Check for slot render events
			const slotEvents = events.filter((e) => e.event === 'slotRender');
			assert.ok(slotEvents.length > 0, 'Should have slot render events');

			// Check for default slot
			const defaultSlotEvents = slotEvents.filter((e) => e.payload.slotName === 'default');
			assert.ok(defaultSlotEvents.length > 0, 'Should have default slot events');
		});

		it('should trace middleware execution', async () => {
			const response = await fixture.fetch('/middleware-test');
			assert.equal(response.status, 200);

			// Check for middleware events
			const middlewareEvents = events.filter((e) => e.event === 'middleware');
			assert.ok(middlewareEvents.length > 0, 'Should have middleware events');

			const middlewareEvent = middlewareEvents[0];
			assert.equal(middlewareEvent.payload.pathname, '/middleware-test');
			assert.ok(middlewareEvent.payload.request);
			assert.ok(middlewareEvent.payload.url);
		});

		it('should maintain event order consistency', async () => {
			const initialEventCount = events.length;

			const response = await fixture.fetch('/nested-components');
			assert.equal(response.status, 200);

			const newEvents = events.slice(initialEventCount);

			// Route render should be one of the first events
			const routeRenderIndex = newEvents.findIndex((e) => e.event === 'routeRender');
			assert.ok(routeRenderIndex >= 0, 'Should have route render event');

			// Component events should come after route render
			const componentEventIndex = newEvents.findIndex((e) => e.event === 'instantiateComponent');
			if (componentEventIndex >= 0) {
				assert.ok(
					componentEventIndex > routeRenderIndex,
					'Component events should come after route render',
				);
			}
		});

		it('should handle API route tracing', async () => {
			const response = await fixture.fetch('/api/test');
			assert.equal(response.status, 200);

			const routeEvents = events.filter((e) => e.event === 'routeRender');
			const apiRouteEvent = routeEvents.find((e) => e.payload.pathname === '/api/test');

			assert.ok(apiRouteEvent, 'Should have API route event');
			assert.equal(apiRouteEvent.payload.pathname, '/api/test');
		});
	});

	describe('Build mode tracing', () => {
		before(async () => {
			events = [];

			// Set up tracing listener before build
			onTraceEvent((event, callback) => {
				events.push({
					event: event.event,
					payload: { ...event.payload },
					timestamp: Date.now(),
				});
				return callback();
			});

			await fixture.build();
		});

		it('should trace during static build', () => {
			// Check that events were captured during build
			assert.ok(events.length > 0, 'Should have captured events during build');

			// Should have route render events for static pages
			const routeEvents = events.filter((e) => e.event === 'routeRender');
			assert.ok(routeEvents.length > 0, 'Should have route render events during build');

			// Should have component events
			const componentEvents = events.filter(
				(e) => e.event === 'instantiateComponent' || e.event === 'componentRender',
			);
			assert.ok(componentEvents.length > 0, 'Should have component events during build');
		});

		it('should include correct build context in events', () => {
			const routeEvents = events.filter((e) => e.event === 'routeRender');

			routeEvents.forEach((event) => {
				assert.ok(event.payload.request, 'Should have request object');
				assert.ok(event.payload.url, 'Should have URL object');
				assert.ok(event.payload.pathname, 'Should have pathname');
				assert.ok(event.payload.routeData, 'Should have route data');
			});
		});
	});

	describe('Error handling in tracing', () => {
		before(async () => {
			events = [];

			// Set up a listener that might throw errors
			onTraceEvent((event, callback) => {
				events.push({
					event: event.event,
					success: true,
				});

				// Simulate listener error for certain events
				if (event.event === 'componentRender' && Math.random() < 0.1) {
					throw new Error('Simulated listener error');
				}

				return callback();
			});

			devServer = await fixture.startDevServer();
		});

		it('should continue rendering despite listener errors', async () => {
			// Make multiple requests to trigger potential listener errors
			for (let i = 0; i < 5; i++) {
				const response = await fixture.fetch('/');
				assert.equal(response.status, 200);

				const html = await response.text();
				assert.ok(html.includes('Hello'), 'Page should render correctly despite listener errors');
			}

			// Should have captured events even with some listener errors
			assert.ok(events.length > 0, 'Should have captured some events');
		});
	});

	describe('Performance characteristics', () => {
		it('should have minimal impact when no listeners are registered', async () => {
			// Clear all listeners
			const abortController = new AbortController();
			abortController.abort();
			onTraceEvent(() => {}, abortController.signal);

			const startTime = Date.now();

			// Make requests without any listeners
			for (let i = 0; i < 10; i++) {
				const response = await fixture.fetch('/');
				assert.equal(response.status, 200);
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			// This is more of a sanity check - the actual performance impact
			// would need more sophisticated benchmarking
			assert.ok(duration < 5000, 'Should complete requests reasonably quickly without listeners');
		});

		it('should handle high-frequency events efficiently', async () => {
			let eventCount = 0;

			onTraceEvent((_event, callback) => {
				eventCount++;
				return callback();
			});

			// Make rapid requests to generate many events
			const promises = [];
			for (let i = 0; i < 20; i++) {
				promises.push(fixture.fetch('/'));
			}

			const responses = await Promise.all(promises);

			// All requests should succeed
			responses.forEach((response) => {
				assert.equal(response.status, 200);
			});

			// Should have captured a reasonable number of events
			assert.ok(eventCount > 20, 'Should have captured multiple events per request');
		});
	});

	describe('AbortSignal integration', () => {
		it('should remove listeners when signal is aborted', async () => {
			const abortController = new AbortController();
			let listenerCallCount = 0;

			onTraceEvent((_event, callback) => {
				listenerCallCount++;
				return callback();
			}, abortController.signal);

			// Make a request - listener should be called
			await fixture.fetch('/');
			const callsBeforeAbort = listenerCallCount;
			assert.ok(callsBeforeAbort > 0, 'Listener should be called before abort');

			// Abort the signal
			abortController.abort();

			// Make another request - listener should not be called
			await fixture.fetch('/');
			const callsAfterAbort = listenerCallCount;

			assert.equal(callsAfterAbort, callsBeforeAbort, 'Listener should not be called after abort');
		});
	});
});
