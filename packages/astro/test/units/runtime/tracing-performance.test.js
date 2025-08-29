import * as assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { onTraceEvent, wrapWithTracing } from '../../../dist/runtime/server/tracing.js';

describe('Tracing Performance', () => {
	let abortController;
	beforeEach(() => {
		abortController = new AbortController();
	});
	afterEach(() => {
		abortController.abort();
	});

	describe('Baseline performance', () => {
		it('should have minimal overhead when no listeners are registered', () => {
			const iterations = 10000;
			const fn = (x) => x * 2;

			// Measure unwrapped function
			const unwrappedStart = performance.now();
			for (let i = 0; i < iterations; i++) {
				fn(i);
			}
			const unwrappedEnd = performance.now();
			const unwrappedTime = unwrappedEnd - unwrappedStart;

			// Measure wrapped function without listeners
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const wrappedStart = performance.now();
			for (let i = 0; i < iterations; i++) {
				wrappedFn(i);
			}
			const wrappedEnd = performance.now();
			const wrappedTime = wrappedEnd - wrappedStart;

			// Wrapped should not be more than 2x slower than unwrapped
			const overhead = wrappedTime / unwrappedTime;
			assert.ok(
				overhead < 2,
				`Overhead too high: ${overhead}x (${wrappedTime}ms vs ${unwrappedTime}ms)`,
			);
		});

		it('should skip payload generation when no listeners are present', () => {
			let payloadGenerationCount = 0;

			const expensivePayloadFn = () => {
				payloadGenerationCount++;
				// Simulate expensive payload generation
				const largeArray = new Array(1000).fill(0).map((_, i) => ({ id: i, value: Math.random() }));
				return {
					moduleId: 'test.astro',
					componentName: 'Test',
					displayName: 'Test',
					request: new Request('http://localhost/'),
					response: new Response(),
					expensiveData: largeArray,
				};
			};

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, expensivePayloadFn);

			// Call function multiple times without listeners
			for (let i = 0; i < 100; i++) {
				wrappedFn();
			}

			// Payload generation should never be called
			assert.equal(payloadGenerationCount, 0);
		});
	});

	describe('Performance with listeners', () => {
		it('should handle high-frequency events efficiently', () => {
			const iterations = 1000;
			const events = [];

			onTraceEvent(
				(event, callback) => {
					events.push(event.event);
					return callback();
				},
				{ signal: abortController.signal },
			);

			const fn = (x) => x * 2;
			const wrappedFn = wrapWithTracing('componentRender', fn, {
				moduleId: 'test.astro',
				componentName: 'Test',
				displayName: 'Test',
				request: new Request('http://localhost/'),
				response: new Response(),
			});

			const start = performance.now();
			for (let i = 0; i < iterations; i++) {
				wrappedFn(i);
			}
			const end = performance.now();
			const totalTime = end - start;

			// Should complete in reasonable time (less than 1 second for 1000 iterations)
			assert.ok(totalTime < 1000, `Too slow: ${totalTime}ms for ${iterations} iterations`);
			assert.equal(events.length, iterations);
		});

		it('should scale linearly with number of listeners', () => {
			const iterations = 100;
			const fn = () => 'result';

			// Test with different numbers of listeners
			const listenerCounts = [1, 5, 10, 20];
			const timings = [];

			for (const listenerCount of listenerCounts) {
				// Clear previous listeners
				const abortController = new AbortController();
				abortController.abort();
				onTraceEvent(() => {}, abortController.signal);

				// Register listeners
				for (let i = 0; i < listenerCount; i++) {
					onTraceEvent((_event, callback) => callback());
				}

				const wrappedFn = wrapWithTracing('componentRender', fn, {
					moduleId: 'test.astro',
					componentName: 'Test',
					displayName: 'Test',
					request: new Request('http://localhost/'),
					response: new Response(),
				});

				const start = performance.now();
				for (let i = 0; i < iterations; i++) {
					wrappedFn();
				}
				const end = performance.now();

				timings.push({
					listenerCount,
					time: end - start,
					timePerIteration: (end - start) / iterations,
				});
			}

			// Verify roughly linear scaling
			const baseTime = timings[0].timePerIteration;
			for (let i = 1; i < timings.length; i++) {
				const timing = timings[i];
				const expectedMaxTime = baseTime * timing.listenerCount * 2; // Allow 2x overhead
				assert.ok(
					timing.timePerIteration < expectedMaxTime,
					`Scaling issue: ${timing.listenerCount} listeners took ${timing.timePerIteration}ms/iteration (expected < ${expectedMaxTime}ms)`,
				);
			}
		});

		it('should handle async listeners efficiently', async () => {
			const iterations = 50; // Fewer iterations for async test
			let callbackCount = 0;

			onTraceEvent(async (_event, callback) => {
				callbackCount++;
				// Small async delay
				await new Promise((resolve) => setTimeout(resolve, 1));
				return callback();
			});

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

			const start = performance.now();
			const promises = [];
			for (let i = 0; i < iterations; i++) {
				promises.push(wrappedFn());
			}
			await Promise.all(promises);
			const end = performance.now();

			const totalTime = end - start;

			// Should complete in reasonable time (account for async overhead)
			assert.ok(totalTime < 5000, `Too slow: ${totalTime}ms for ${iterations} async iterations`);
			assert.equal(callbackCount, iterations);
		});
	});

	describe('Memory usage patterns', () => {
		it('should not leak memory with frequent listener registration/cleanup', () => {
			const initialMemory = process.memoryUsage().heapUsed;
			const controllers = [];

			// Register and cleanup many listeners
			for (let cycle = 0; cycle < 10; cycle++) {
				// Register 100 listeners
				for (let i = 0; i < 100; i++) {
					const controller = new AbortController();
					controllers.push(controller);
					onTraceEvent(() => {}, controller.signal);
				}

				// Execute some traced functions
				const wrappedFn = wrapWithTracing('componentRender', () => 'result', {
					moduleId: 'test.astro',
					componentName: 'Test',
					displayName: 'Test',
					request: new Request('http://localhost/'),
					response: new Response(),
				});

				for (let i = 0; i < 10; i++) {
					wrappedFn();
				}

				// Cleanup listeners
				controllers.forEach((controller) => controller.abort());
				controllers.length = 0;

				// Force garbage collection if available
				if (global.gc) {
					global.gc();
				}
			}

			const finalMemory = process.memoryUsage().heapUsed;
			const memoryGrowth = finalMemory - initialMemory;
			const memoryGrowthMB = memoryGrowth / (1024 * 1024);

			// Memory growth should be minimal (less than 10MB)
			assert.ok(memoryGrowthMB < 10, `Potential memory leak: ${memoryGrowthMB}MB growth`);
		});

		it('should handle large payload objects efficiently', () => {
			let eventCount = 0;

			onTraceEvent((event, callback) => {
				eventCount++;
				// Access payload to ensure it's processed
				const payloadSize = JSON.stringify(event.payload).length;
				assert.ok(payloadSize > 0);
				return callback();
			});

			// Create a large but realistic payload
			const largePayload = {
				moduleId: 'test.astro',
				componentName: 'LargeComponent',
				displayName: 'Large Component with Lots of Data',
				request: new Request('http://localhost/large-page?param=' + 'x'.repeat(1000)),
				response: new Response(),
				componentProps: {
					data: new Array(1000).fill(0).map((_, i) => ({
						id: i,
						name: `Item ${i}`,
						description: `Description for item ${i}`.repeat(10),
						metadata: {
							created: new Date().toISOString(),
							tags: [`tag-${i}`, `category-${i % 10}`, `type-${i % 5}`],
						},
					})),
				},
			};

			const fn = () => 'result';
			const wrappedFn = wrapWithTracing('componentRender', fn, largePayload);

			const start = performance.now();
			for (let i = 0; i < 10; i++) {
				wrappedFn();
			}
			const end = performance.now();

			const totalTime = end - start;
			assert.ok(totalTime < 1000, `Large payload processing too slow: ${totalTime}ms`);
			assert.equal(eventCount, 10);
		});
	});

	describe('Edge case performance', () => {
		it('should handle many simultaneous wrapped functions', () => {
			const functionCount = 100;
			const iterations = 10;
			let totalEvents = 0;

			onTraceEvent((_event, callback) => {
				totalEvents++;
				return callback();
			});

			// Create many different wrapped functions
			const wrappedFunctions = [];
			for (let i = 0; i < functionCount; i++) {
				const fn = (x) => x + i;
				const wrappedFn = wrapWithTracing('componentRender', fn, {
					moduleId: `test-${i}.astro`,
					componentName: `Test${i}`,
					displayName: `Test ${i}`,
					request: new Request('http://localhost/'),
					response: new Response(),
				});
				wrappedFunctions.push(wrappedFn);
			}

			const start = performance.now();
			for (let iteration = 0; iteration < iterations; iteration++) {
				for (let i = 0; i < functionCount; i++) {
					wrappedFunctions[i](iteration);
				}
			}
			const end = performance.now();

			const totalTime = end - start;
			const expectedEvents = functionCount * iterations;

			assert.equal(totalEvents, expectedEvents);
			assert.ok(
				totalTime < 2000,
				`Too slow for ${functionCount} functions x ${iterations} iterations: ${totalTime}ms`,
			);
		});

		it('should perform well with nested tracing calls', () => {
			let eventCount = 0;

			onTraceEvent((_event, callback) => {
				eventCount++;
				return callback();
			});

			const createNestedFunction = (depth) => {
				if (depth === 0) {
					return () => 'base';
				}

				const innerFn = createNestedFunction(depth - 1);
				return wrapWithTracing(
					'componentRender',
					() => {
						return `level-${depth}-${innerFn()}`;
					},
					{
						moduleId: `nested-${depth}.astro`,
						componentName: `Nested${depth}`,
						displayName: `Nested Level ${depth}`,
						request: new Request('http://localhost/'),
						response: new Response(),
					},
				);
			};

			const nestedDepth = 10;
			const nestedFn = createNestedFunction(nestedDepth);

			const start = performance.now();
			const result = nestedFn();
			const end = performance.now();

			const totalTime = end - start;

			assert.ok(result.includes('base'));
			assert.equal(eventCount, nestedDepth);
			assert.ok(totalTime < 100, `Nested calls too slow: ${totalTime}ms for depth ${nestedDepth}`);
		});

		it('should handle rapid abort signal changes efficiently', () => {
			const cycles = 100;
			let eventCount = 0;

			const start = performance.now();

			for (let i = 0; i < cycles; i++) {
				const controller = new AbortController();

				onTraceEvent((_event, callback) => {
					eventCount++;
					return callback();
				}, controller.signal);

				const wrappedFn = wrapWithTracing('componentRender', () => `result-${i}`, {
					moduleId: 'test.astro',
					componentName: 'Test',
					displayName: 'Test',
					request: new Request('http://localhost/'),
					response: new Response(),
				});

				wrappedFn();
				controller.abort();
			}

			const end = performance.now();
			const totalTime = end - start;

			assert.equal(eventCount, cycles);
			assert.ok(
				totalTime < 1000,
				`Rapid abort cycles too slow: ${totalTime}ms for ${cycles} cycles`,
			);
		});
	});
});
