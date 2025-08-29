import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { onTraceEvent, wrapWithTracing } from '../../../dist/runtime/server/tracing.js';

describe('Tracing API', () => {
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

	describe('onTraceEvent', () => {
		it('should register a trace listener', () => {
			const mockListener = () => {};
			onTraceEvent(mockListener);

			// Test that the listener was registered by wrapping a function
			const wrappedFn = wrapWithTracing('componentRender', () => 'test', {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			// Should execute without error
			const result = wrappedFn();
			assert.equal(result, 'test');
		});

		it('should support AbortSignal for listener cleanup', () => {
			const abortController = new AbortController();
			let listenerCalled = false;

			const testListener = () => {
				listenerCalled = true;
			};

			onTraceEvent(testListener, abortController.signal);

			// Abort the signal
			abortController.abort();

			// Create a wrapped function
			const wrappedFn = wrapWithTracing('componentRender', () => 'test', {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			wrappedFn();

			// Listener should not have been called
			assert.equal(listenerCalled, false);
		});

		it('should not register listener if signal is already aborted', () => {
			const abortController = new AbortController();
			abortController.abort();

			let listenerCalled = false;
			const testListener = () => {
				listenerCalled = true;
			};

			onTraceEvent(testListener, abortController.signal);

			const wrappedFn = wrapWithTracing('componentRender', () => 'test', {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			wrappedFn();

			assert.equal(listenerCalled, false);
		});
	});

	describe('wrapWithTracing', () => {
		it('should execute function without listeners', () => {
			const fn = () => 'test result';
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const result = wrappedFn();
			assert.equal(result, 'test result');
		});

		it('should call listeners with correct event data', () => {
			onTraceEvent(listener);

			const payload = {
				moduleId: 'test.astro',
				componentName: 'TestComponent',
				displayName: 'Test Component',
				request: new Request('http://localhost/test'),
				response: new Response(),
			};

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, payload);

			const result = wrappedFn();

			assert.equal(result, 'result');
			assert.equal(events.length, 1);
			assert.equal(events[0].event, 'componentRender');
			assert.deepEqual(events[0].payload, payload);
			assert.equal(events[0].callbackCalled, true);
		});

		it('should support dynamic payload generation', () => {
			onTraceEvent(listener);

			const fn = function (arg1, arg2) {
				return `${arg1}-${arg2}`;
			};

			const payloadFn = function (arg1, arg2) {
				return {
					moduleId: `module-${arg1}`,
					componentName: arg2,
					displayName: arg2,
					request: new Request('http://localhost/'),
					response: new Response(),
				};
			};

			const wrappedFn = wrapWithTracing('componentRender', fn, payloadFn);

			const result = wrappedFn('test', 'Component');

			assert.equal(result, 'test-Component');
			assert.equal(events.length, 1);
			assert.equal(events[0].payload.moduleId, 'module-test');
			assert.equal(events[0].payload.componentName, 'Component');
		});

		it('should preserve function context (this)', () => {
			onTraceEvent(listener);

			const obj = {
				value: 42,
				method: wrapWithTracing(
					'componentRender',
					function () {
						return this.value;
					},
					{
						moduleId: 'test.astro',
						componentName: 'Test',
						displayName: 'Test',
						request: new Request('http://localhost/'),
						response: new Response(),
					},
				),
			};

			const result = obj.method();
			assert.equal(result, 42);
		});

		it('should handle async functions', async () => {
			onTraceEvent(listener);

			const asyncFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
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
		});

		it('should handle function arguments correctly', () => {
			onTraceEvent(listener);

			const fn = (a, b, c) => a + b + c;
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const result = wrappedFn(1, 2, 3);
			assert.equal(result, 6);
		});
	});

	describe('Multiple listeners', () => {
		it('should call all listeners in order', () => {
			const callOrder = [];

			const listener1 = (_event, callback) => {
				callOrder.push('listener1-start');
				const result = callback();
				callOrder.push('listener1-end');
				return result;
			};

			const listener2 = (_event, callback) => {
				callOrder.push('listener2-start');
				const result = callback();
				callOrder.push('listener2-end');
				return result;
			};

			onTraceEvent(listener1);
			onTraceEvent(listener2);

			const fn = () => {
				callOrder.push('function-executed');
				return 'result';
			};

			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const result = wrappedFn();

			assert.equal(result, 'result');
			assert.deepEqual(callOrder, [
				'listener1-start',
				'listener2-start',
				'function-executed',
				'listener2-end',
				'listener1-end',
			]);
		});

		it('should handle listener errors gracefully', () => {
			const workingListener = (event, callback) => {
				events.push({ type: 'working', event });
				return callback();
			};

			const errorListener = (_event, _callback) => {
				throw new Error('Listener error');
			};

			onTraceEvent(workingListener);
			onTraceEvent(errorListener);

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			// Should not throw despite listener error
			const result = wrappedFn();
			assert.equal(result, 'result');
			assert.equal(events.length, 1);
			assert.equal(events[0].type, 'working');
		});
	});

	describe('Event types', () => {
		beforeEach(() => {
			onTraceEvent(listener);
		});

		it('should handle instantiateComponent events', () => {
			const payload = {
				moduleId: 'Component.astro',
				componentName: 'Component',
				displayName: 'Component',
				request: new Request('http://localhost/'),
				response: new Response(),
			};

			const wrappedFn = wrapWithTracing('instantiateComponent', () => 'result', payload);
			wrappedFn();

			assert.equal(events[0].event, 'instantiateComponent');
			assert.deepEqual(events[0].payload, payload);
		});

		it('should handle componentFrontmatter events', () => {
			const payload = {
				moduleId: 'Component.astro',
				name: 'Component',
				request: new Request('http://localhost/'),
				response: new Response(),
			};

			const wrappedFn = wrapWithTracing('componentFrontmatter', () => 'result', payload);
			wrappedFn();

			assert.equal(events[0].event, 'componentFrontmatter');
			assert.deepEqual(events[0].payload, payload);
		});

		it('should handle slotRender events', () => {
			const payload = {
				slotName: 'default',
				componentModuleId: 'Component.astro',
				componentName: 'Component',
			};

			const wrappedFn = wrapWithTracing('slotRender', () => 'result', payload);
			wrappedFn();

			assert.equal(events[0].event, 'slotRender');
			assert.deepEqual(events[0].payload, payload);
		});

		it('should handle routeRender events', () => {
			const payload = {
				rootModuleId: 'page.astro',
				request: new Request('http://localhost/test'),
				clientAddress: '127.0.0.1',
				pathname: '/test',
				routeData: { route: '/test' },
				url: new URL('http://localhost/test'),
				partial: false,
			};

			const wrappedFn = wrapWithTracing('routeRender', () => 'result', payload);
			wrappedFn();

			assert.equal(events[0].event, 'routeRender');
			assert.deepEqual(events[0].payload, payload);
		});

		it('should handle middleware events', () => {
			const payload = {
				name: 'auth',
				pathname: '/protected',
				url: new URL('http://localhost/protected'),
				request: new Request('http://localhost/protected'),
			};

			const wrappedFn = wrapWithTracing('middleware', () => 'result', payload);
			wrappedFn();

			assert.equal(events[0].event, 'middleware');
			assert.deepEqual(events[0].payload, payload);
		});
	});

	describe('Callback behavior', () => {
		it('should handle async callbacks', async () => {
			let _callbackResult;

			const asyncListener = async (_event, callback) => {
				_callbackResult = await callback();
			};

			onTraceEvent(asyncListener);

			const asyncFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
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
		});

		it('should handle callback called multiple times', () => {
			let callCount = 0;

			const multiCallListener = (_event, callback) => {
				// Call callback multiple times
				callback();
				callback();
				const result = callback();
				callCount++;
				return result;
			};

			onTraceEvent(multiCallListener);

			let fnCallCount = 0;
			const fn = () => {
				fnCallCount++;
				return 'result';
			};

			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const result = wrappedFn();

			assert.equal(result, 'result');
			assert.equal(callCount, 1);
			assert.equal(fnCallCount, 1); // Function should only be called once
		});

		it('should preserve errors thrown by wrapped function', () => {
			onTraceEvent(listener);

			const errorFn = () => {
				throw new Error('Function error');
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
					message: 'Function error',
				},
			);
		});

		it('should handle errors in callback gracefully', () => {
			let errorCaught = false;

			const errorHandlingListener = (_event, callback) => {
				try {
					return callback();
				} catch (error) {
					errorCaught = true;
					throw error;
				}
			};

			onTraceEvent(errorHandlingListener);

			const errorFn = () => {
				throw new Error('Function error');
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
					message: 'Function error',
				},
			);

			assert.equal(errorCaught, true);
		});
	});

	describe('Performance optimization', () => {
		it('should skip event creation when no listeners are registered', () => {
			let payloadFnCalled = false;

			const payloadFn = () => {
				payloadFnCalled = true;
				return {
					moduleId: 'test.astro',
					componentName: 'Test',
					displayName: 'Test',
					request: new Request('http://localhost/'),
					response: new Response(),
				};
			};

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, payloadFn);

			const result = wrappedFn();

			assert.equal(result, 'result');
			assert.equal(payloadFnCalled, false); // Payload function should not be called
		});

		it('should create payload when listeners are present', () => {
			onTraceEvent(listener);

			let payloadFnCalled = false;

			const payloadFn = () => {
				payloadFnCalled = true;
				return {
					moduleId: 'test.astro',
					componentName: 'Test',
					displayName: 'Test',
					request: new Request('http://localhost/'),
					response: new Response(),
				};
			};

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, payloadFn);

			const result = wrappedFn();

			assert.equal(result, 'result');
			assert.equal(payloadFnCalled, true); // Payload function should be called
		});
	});
});
