import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
	clearTraceListeners,
	onTraceEvent,
	wrapWithTracing,
} from '../../../dist/runtime/server/tracing.js';

describe('Tracing API', () => {
	afterEach(() => {
		clearTraceListeners();
	});

	describe('onTraceEvent', () => {
		it('should register a trace listener', () => {
			let listenerCalled = false;
			onTraceEvent(() => {
				listenerCalled = true;
			});

			const wrappedFn = wrapWithTracing('componentRender', () => 'test', {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const result = wrappedFn();
			assert.equal(result, 'test', 'Wrapped function should return correct result');
			assert.ok(listenerCalled, 'Listener should have been called');
		});

		it('should support AbortSignal for listener cleanup', () => {
			const controller = new AbortController();
			let listenerCalled = false;

			onTraceEvent(() => {
				listenerCalled = true;
			}, controller.signal);

			controller.abort();

			const wrappedFn = wrapWithTracing('componentRender', () => 'test', {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			wrappedFn();

			assert.ok(!listenerCalled, 'Listener should not have been called after abort');
		});

		it('should not register listener if signal is already aborted', () => {
			const abortedSignal = AbortSignal.abort();

			let listenerCalled = false;

			onTraceEvent(() => {
				listenerCalled = true;
			}, abortedSignal);

			const wrappedFn = wrapWithTracing('componentRender', () => 'test', {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			wrappedFn();

			assert.ok(!listenerCalled, 'Listener should not have been registered with aborted signal');
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
			const events = [];
			onTraceEvent((event) => {
				events.push(event);
			});

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
			assert.deepEqual(events, [{ event: 'componentRender', payload }]);
		});

		it('should support dynamic payload generation', () => {
			const events = [];
			onTraceEvent((event) => {
				events.push(event);
			});

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
			assert.deepEqual(events, [
				{
					event: 'componentRender',
					payload: payloadFn('test', 'Component'),
				},
			]);
		});

		it('should preserve function context (this)', () => {
			let listenerCalled = false;
			onTraceEvent(() => {
				listenerCalled = true;
			});

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
			assert.ok(listenerCalled, 'Listener should have been called');
		});

		it('should handle async functions', async () => {
			let listenerCalled = false;
			onTraceEvent(() => {
				listenerCalled = true;
			});

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
			assert.ok(listenerCalled, 'Listener should have been called');
		});

		it('should handle function arguments correctly', () => {
			let listenerCalled = false;
			onTraceEvent(() => {
				listenerCalled = true;
			});

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
			assert.ok(listenerCalled, 'Listener should have been called');
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
	});

	describe('Event types', () => {
		const events = [];
		beforeEach(() => {
			events.length = 0;
			onTraceEvent((event) => {
				events.push(event);
			});
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

		it('should skip event creation when no listeners are registered', () => {
			clearTraceListeners(); // Ensure no listeners are present
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
	});

	describe('Callback behavior', () => {
		it('should handle async callbacks', async () => {
			let callbackResult;

			const asyncListener = async (_event, callback) => {
				callbackResult = await callback();
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
			assert.strictEqual(
				callbackResult,
				void 0,
				'Wrapped function result should not be visible to listener',
			);
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
			onTraceEvent(() => {});

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

			assert.throws(wrappedFn, {
				message: 'Function error',
			});
		});
	});
});
