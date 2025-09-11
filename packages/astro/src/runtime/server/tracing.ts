import type { ServerDeserializedManifest } from '../../types/public/index.js';
import type { TraceEvent, TraceEventsPayloads, TraceListener } from '../../types/public/tracing.js';

export type { TraceEvent, TraceEventsPayloads, TraceListener };

const listeners: TraceListener[] = [];

/**
 * Register a trace listener that will be called on every trace event.
 *
 * The listener can optionally be associated with an AbortSignal to
 * automatically remove it when the signal is aborted.
 * If the signal is already aborted or is aborting, the listener will not be registered.
 *
 * Listeners are called in the order they are registered.
 * Each listener receives the trace event and a `next` callback.
 * Calling the `next` callback will invoke the next listener in the chain,
 * or the traced function if there are no more listeners.
 *
 * Not calling `next` means the next listener or the traced function will
 * be called automatically after the current listener returns.
 * Calling `next` multiple times will have no effect after the first call,
 * the same value or error will be returned to the caller without invoking
 * the next listener or the traced function again.
 *
 * Since trace events can describe both synchronous and asynchronous operations,
 * listeners MUST invoke the `next` function synchronously if they ever do invoke it.
 * A listener must not return a promise that can reject, such a promise rejection
 * will not be handled and trigger an unhandled promise rejection error on the runtime.
 *
 * @param listener The listener function to register.
 * @param signal An optional AbortSignal to remove the listener when aborted.
 */
export function onTraceEvent(listener: TraceListener, signal?: AbortSignal) {
	if (signal) {
		if (signal.aborted) {
			// The signal is already aborted, the listener should never be called.
			// Returning early avoids both possible scenarios:
			// - The `abort` event is being processed and the listener would be removed depending on a race condition.
			// - The `abort` signal was already processed and the listener will never be removed, triggering after the signal is aborted.
			return;
		}
		signal.addEventListener('abort', () => {
			listeners.splice(listeners.indexOf(listener), 1);
		});
	}

	listeners.push(listener);
}

/**
 * Get the number of trace listeners currently registered.
 * Primarily useful for tests to check how many listeners are active
 * after some operation.
 */
export function getTraceListenersCount() {
	return listeners.length;
}

/**
 * Clear all trace listeners.
 * Primarily useful for tests to ensure no listeners are leaking between tests.
 */
export function clearTraceListeners() {
	listeners.length = 0;
}

/**
 * A wrapper to call listeners in sequence, ensuring that each listener is
 * called once and only once, even if some of them don't call the `next` callback
 * or call it multiple times.
 *
 * This ensures that the presence of tracing listeners cannot interfere with
 * other tracing listeners or the function being traced.
 */
function sequenceListeners<T>(event: TraceEvent, fn: () => T, index = 0): T {
	if (index >= listeners.length) {
		return fn();
	}

	const listener = listeners[index];

	let state: 'pending' | 'called' | 'failed' = 'pending';
	let resultValue: T;
	let errorValue: unknown;
	// Wrapper to ensure the callback is only called once
	// but that always yields the same effect.
	const next = () => {
		switch (state) {
			case 'pending':
				try {
					resultValue = sequenceListeners(event, fn, index + 1);
				} catch (e) {
					state = 'failed';
					errorValue = e;
					throw e;
				}
				state = 'called';
			case 'called':
				return resultValue!;
			case 'failed':
				throw errorValue;
		}
	};

	try {
		listener(event, () => {
			const result = next();
			if (result instanceof Promise) {
				// Return a promise that always resolve to void, but only once
				// resultValue resolves. This allow tracing listeners to await
				// the completion of the inner function without without having
				// access to any internal values.
				const hiddenResult = result.then(() => {});
				// Prevent unhandled promise rejections in case the inner promise fails.
				hiddenResult.catch(() => {
					/* ignore */
				});
				return hiddenResult;
			}
		});
	} catch {
		// Ignore errors in listeners to avoid breaking the main flow.
	}

	// Return the result of `fn`, calling next handles deduplication
	// in case it was already called by the listener.
	return next();
}

// TODO: Figure out why this module is being reported as unknown
const tracingEnabled = await import('astro:config/server' as any)
	.then((m: ServerDeserializedManifest) => m.enableTracing)
	// Tracing enabled in case of import errors to allow testing and
	// dev environments outside of Vite.
	// Once the feature is stabilized this flag wouldn't be needed since tracing
	// always be enabled (disabling by not having listeners instead of a config flag).
	.catch(() => true);

export function wrapWithTracing<
	This,
	Args extends any[],
	Return,
	Event extends keyof TraceEventsPayloads,
>(
	event: Event,
	fn: (this: This, ...args: Args) => Return,
	payload: TraceEventsPayloads[Event] | ((this: This, ...args: Args) => TraceEventsPayloads[Event]),
): (this: This, ...args: Args) => Return {
	if (!tracingEnabled) {
		return fn;
	}

	return function (this: This, ...args: Args): Return {
		if (listeners.length === 0) {
			// Avoid constructing payloads and emitting events if no listeners are attached
			return fn.apply(this, args);
		}

		const eventArgs = {
			event,
			payload: typeof payload === 'function' ? payload.apply(this, args) : payload,
		} as TraceEvent;

		return sequenceListeners(eventArgs, () => fn.apply(this, args));
	};
}
