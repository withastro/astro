import * as assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
	clearTraceListeners,
	onTraceEvent,
	wrapWithTracing,
} from '../../../dist/runtime/server/tracing.js';

describe('Tracing Edge Cases', () => {
	afterEach(() => {
		clearTraceListeners();
	});

	describe('Memory management', () => {
		it('should properly clean up listeners with AbortSignal', () => {
			const controllers = [];
			let calls = [];

			// Register multiple listeners with different abort signals
			for (let i = 0; i < 10; i++) {
				const controller = new AbortController();
				controllers.push(controller);
				const currentIndex = i;

				onTraceEvent(() => {
					calls.push(currentIndex);
				}, controller.signal);
			}

			const wrappedFn = wrapWithTracing('componentRender', () => 'test', {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			// Execute once - should call all 10 listeners
			wrappedFn();
			assert.deepEqual(calls, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

			// Abort half the controllers
			for (let i = 0; i < 5; i++) {
				controllers[i].abort();
			}

			// Execute again - should only call remaining 5 listeners
			calls = [];
			wrappedFn();
			assert.deepEqual(calls, [5, 6, 7, 8, 9]);

			// Abort remaining controllers
			for (let i = 5; i < 10; i++) {
				controllers[i].abort();
			}

			// Execute again - should call no listeners
			calls = [];
			wrappedFn();
			assert.deepEqual(calls, []);
		});

		it('should handle immediately aborting after registration', () => {
			const controllers = [];
			let calls = [];

			// Immediately abort half of the listeners after registering
			for (let i = 0; i < 30; i++) {
				const currentIndex = i;
				const controller = new AbortController();
				controllers.push(controller);

				onTraceEvent(() => {
					calls.push(currentIndex);
				}, controller.signal);

				// Abort every other listener immediately
				if (i % 2 === 0) {
					controller.abort();
				}
			}

			const wrappedFn = wrapWithTracing('componentRender', () => 'test', {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			wrappedFn();

			// Should only execute the non-aborted listeners (50)
			assert.deepEqual(calls, [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29]);
		});
	});

	describe('Error resilience', () => {
		it('should handle listeners that throw errors', () => {
			let workingCalled = false;
			const workingListener = () => {
				workingCalled = true;
			};

			const errorListener1 = () => {
				throw new Error('Error in listener 1');
			};

			const errorListener2 = () => {
				throw new TypeError('Type error in listener 2');
			};

			const errorListener3 = () => {
				throw 'String error';
			};

			onTraceEvent(errorListener1);
			onTraceEvent(errorListener2);
			onTraceEvent(workingListener);
			onTraceEvent(errorListener3);

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			// Should not throw despite multiple listener errors
			const result = wrappedFn();
			assert.deepEqual(result, 'result');
			assert.ok(workingCalled, 'Working listener should have been called');
		});

		it('should preserve original function errors even with listener errors', () => {
			onTraceEvent(() => {
				throw new Error('Listener error');
			});

			const errorFn = () => {
				throw new Error('Original function error');
			};

			const wrappedFn = wrapWithTracing('componentRender', errorFn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			assert.throws(wrappedFn, {
				message: 'Original function error',
			});
		});
	});

	describe('Listeners edge cases', () => {
		it('should handle listener registration during execution', () => {
			let calls = [];

			const staticListener = () => {
				calls.push('static');

				// Register another listener during execution
				if (calls.length === 1) {
					onTraceEvent(() => {
						calls.push('dynamic');
					});
				}
			};

			onTraceEvent(staticListener);

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			wrappedFn();
			assert.deepEqual(calls, ['static', 'dynamic']);
		});

		it('should handle listener registration during signal abort handling', () => {
			const controller = new AbortController();

			let calls = [];

			controller.signal.addEventListener('abort', () => {
				onTraceEvent(() => {
					calls.push('called');
				}, controller.signal);
			});

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			wrappedFn();
			assert.deepEqual(calls, [], 'Listener with aborting signal should be ignored');
		});

		it('should handle listeners calling next multiple times', () => {
			let valuesFromNext = [];

			onTraceEvent((_event, next) => {
				valuesFromNext.push(next());
				valuesFromNext.push(next());
			});

			let internalCalls = 0;
			const fn = () => {
				internalCalls++;
				return { message: 'result' };
			};
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			wrappedFn();
			assert.equal(internalCalls, 1, 'Original function should be called only once');
			assert.ok(
				Object.is(valuesFromNext[0], valuesFromNext[1]),
				'Both next() calls should return the same value',
			);
		});
	});
});
