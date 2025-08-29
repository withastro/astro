import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { onTraceEvent, wrapWithTracing } from '../../../dist/runtime/server/tracing.js';

describe('Tracing Edge Cases', () => {
	let events = [];
	let listener;

	beforeEach(() => {
		events = [];
		listener = (event, callback) => {
			events.push({ ...event, callbackCalled: false });
			const result = callback();
			events[events.length - 1].callbackCalled = true;
			return result;
		};
	});

	afterEach(() => {
		// Clear all listeners by calling onTraceEvent with an aborted signal
		const abortController = new AbortController();
		abortController.abort();
		onTraceEvent(() => {}, abortController.signal);
	});

	describe('Memory management', () => {
		it('should properly clean up listeners with AbortSignal', () => {
			const controllers = [];
			let totalCalls = 0;

			// Register multiple listeners with different abort signals
			for (let i = 0; i < 10; i++) {
				const controller = new AbortController();
				controllers.push(controller);

				onTraceEvent(() => {
					totalCalls++;
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
			assert.equal(totalCalls, 10);

			// Abort half the controllers
			for (let i = 0; i < 5; i++) {
				controllers[i].abort();
			}

			// Execute again - should only call remaining 5 listeners
			const callsBefore = totalCalls;
			wrappedFn();
			assert.equal(totalCalls - callsBefore, 5);

			// Abort remaining controllers
			for (let i = 5; i < 10; i++) {
				controllers[i].abort();
			}

			// Execute again - should call no listeners
			const callsBeforeCleanup = totalCalls;
			wrappedFn();
			assert.equal(totalCalls - callsBeforeCleanup, 0);
		});

		it('should handle rapid listener registration and cleanup', () => {
			const controllers = [];
			let _registeredCount = 0;
			let executedCount = 0;

			// Rapidly register and abort listeners
			for (let i = 0; i < 100; i++) {
				const controller = new AbortController();
				controllers.push(controller);

				onTraceEvent(() => {
					executedCount++;
				}, controller.signal);
				_registeredCount++;

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
			assert.equal(executedCount, 50);
		});
	});

	describe('Error resilience', () => {
		it('should handle listeners that throw errors', () => {
			const workingListener = (event, callback) => {
				events.push({ type: 'working', event: event.event });
				return callback();
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

			onTraceEvent(workingListener);
			onTraceEvent(errorListener1);
			onTraceEvent(errorListener2);
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
			assert.equal(result, 'result');
			assert.equal(events.length, 1);
			assert.equal(events[0].type, 'working');
		});

		it('should handle async listener errors', async () => {
			const workingListener = async (event, callback) => {
				events.push({ type: 'working', event: event.event });
				return await callback();
			};

			const asyncErrorListener = async () => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				throw new Error('Async error');
			};

			onTraceEvent(workingListener);
			onTraceEvent(asyncErrorListener);

			const asyncFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				return 'async result';
			};

			const wrappedFn = wrapWithTracing('componentRender', asyncFn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const result = await wrappedFn();
			assert.equal(result, 'async result');
			assert.equal(events.length, 1);
			assert.equal(events[0].type, 'working');
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

			assert.throws(
				() => {
					wrappedFn();
				},
				{
					message: 'Original function error',
				},
			);
		});
	});

	describe('Payload edge cases', () => {
		it('should handle payload functions that throw errors', () => {
			onTraceEvent(listener);

			const errorPayloadFn = () => {
				throw new Error('Payload generation error');
			};

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, errorPayloadFn);

			// Should still execute the function even if payload generation fails
			const result = wrappedFn();
			assert.equal(result, 'result');
			// No events should be recorded due to payload error
			assert.equal(events.length, 0);
		});

		it('should handle circular references in payload', () => {
			onTraceEvent(listener);

			const circularObj = { name: 'test' };
			circularObj.self = circularObj;

			const payload = {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
				circular: circularObj,
			};

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, payload);

			// Should handle circular references gracefully
			const result = wrappedFn();
			assert.equal(result, 'result');
			assert.equal(events.length, 1);
			assert.equal(events[0].payload.circular.name, 'test');
		});

		it('should handle very large payloads', () => {
			onTraceEvent(listener);

			const largeArray = new Array(10000).fill(0).map((_, i) => ({
				id: i,
				data: `item-${i}`,
				value: Math.random(),
			}));

			const payload = {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
				largeData: largeArray,
			};

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, payload);

			const result = wrappedFn();
			assert.equal(result, 'result');
			assert.equal(events.length, 1);
			assert.equal(events[0].payload.largeData.length, 10000);
		});
	});

	describe('Callback edge cases', () => {
		it('should handle callback that returns undefined', () => {
			const undefinedListener = (event, callback) => {
				const result = callback();
				events.push({ event: event.event, result });
				return undefined; // Explicitly return undefined
			};

			onTraceEvent(undefinedListener);

			const fn = () => 'function result';
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const result = wrappedFn();
			assert.equal(result, 'function result');
			assert.equal(events.length, 1);
			assert.equal(events[0].result, 'function result');
		});

		it('should handle callback called with wrong context', () => {
			const contextChangingListener = (event, callback) => {
				// Try to call callback with different context
				const result = callback.call({ differentContext: true });
				events.push({ event: event.event, result });
				return result;
			};

			onTraceEvent(contextChangingListener);

			const obj = {
				value: 42,
				method: function () {
					return this.value;
				},
			};

			const wrappedMethod = wrapWithTracing('componentRender', obj.method, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			// Bind the method to preserve context
			const boundMethod = wrappedMethod.bind(obj);
			const result = boundMethod();

			assert.equal(result, 42);
			assert.equal(events.length, 1);
		});

		it('should handle synchronous callback in async listener', async () => {
			const asyncListener = async (event, callback) => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				const result = callback(); // Sync callback in async listener
				events.push({ event: event.event, result });
				await new Promise((resolve) => setTimeout(resolve, 1));
				return result;
			};

			onTraceEvent(asyncListener);

			const syncFn = () => 'sync result';
			const wrappedFn = wrapWithTracing('componentRender', syncFn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const result = wrappedFn();
			assert.equal(result, 'sync result');
			assert.equal(events.length, 1);
		});
	});

	describe('Concurrency edge cases', () => {
		it('should handle concurrent wrapped function calls', async () => {
			const concurrentListener = (event, callback) => {
				events.push({ event: event.event, start: Date.now() });
				const result = callback();
				events[events.length - 1].end = Date.now();
				return result;
			};

			onTraceEvent(concurrentListener);

			const asyncFn = async (delay, id) => {
				await new Promise((resolve) => setTimeout(resolve, delay));
				return `result-${id}`;
			};

			const wrappedFn = wrapWithTracing('componentRender', asyncFn, (_delay, id) => ({
				moduleId: `test-${id}.astro`,
				componentName: `Test${id}`,
				displayName: `Test ${id}`,
				request: new Request('http://localhost/'),
				response: new Response(),
			}));

			// Call multiple times concurrently
			const promises = [wrappedFn(10, 1), wrappedFn(5, 2), wrappedFn(15, 3)];

			const results = await Promise.all(promises);

			assert.deepEqual(results, ['result-1', 'result-2', 'result-3']);
			assert.equal(events.length, 3);

			// Verify all events have start and end times
			events.forEach((event) => {
				assert.ok(event.start);
				assert.ok(event.end);
				assert.ok(event.end >= event.start);
			});
		});

		it('should handle listener registration during execution', () => {
			let executionCount = 0;

			const dynamicListener = (event, callback) => {
				executionCount++;

				// Register another listener during execution
				if (executionCount === 1) {
					onTraceEvent((event, callback) => {
						events.push({ type: 'dynamic', event: event.event });
						return callback();
					});
				}

				events.push({ type: 'original', event: event.event });
				return callback();
			};

			onTraceEvent(dynamicListener);

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			// First call should only trigger original listener
			wrappedFn();
			assert.equal(events.length, 1);
			assert.equal(events[0].type, 'original');

			// Second call should trigger both listeners
			wrappedFn();
			assert.equal(events.length, 3); // original + original + dynamic
		});
	});

	describe('Type coercion edge cases', () => {
		it('should handle non-string event names', () => {
			onTraceEvent(listener);

			// This shouldn't normally happen, but test robustness
			const fn = () => 'result';
			const wrappedFn = wrapWithTracing(123, fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const result = wrappedFn();
			assert.equal(result, 'result');
			assert.equal(events.length, 1);
			assert.equal(events[0].event, 123);
		});

		it('should handle null/undefined payload values', () => {
			onTraceEvent(listener);

			const payload = {
				moduleId: null,
				componentName: undefined,
				displayName: '',
				request: new Request('http://localhost/'),
				response: new Response(),
			};

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, payload);

			const result = wrappedFn();
			assert.equal(result, 'result');
			assert.equal(events.length, 1);
			assert.equal(events[0].payload.moduleId, null);
			assert.equal(events[0].payload.componentName, undefined);
			assert.equal(events[0].payload.displayName, '');
		});

		it('should handle functions that return different types', () => {
			onTraceEvent(listener);

			const testCases = [
				() => 'string',
				() => 42,
				() => true,
				() => null,
				() => undefined,
				() => ({ object: true }),
				() => [1, 2, 3],
				() => new Date(),
			];

			testCases.forEach((fn, index) => {
				const wrappedFn = wrapWithTracing('componentRender', fn, {
					moduleId: `test-${index}.astro`,
					componentName: 'Test',
					displayName: 'Test',
					request: new Request('http://localhost/'),
					response: new Response(),
				});

				const result = wrappedFn();
				const expectedResult = fn();

				if (typeof expectedResult === 'object' && expectedResult !== null) {
					assert.deepEqual(result, expectedResult);
				} else {
					assert.equal(result, expectedResult);
				}
			});

			assert.equal(events.length, testCases.length);
		});
	});
});
