import type { ServerDeserializedManifest } from '../../types/public/index.js';
import type { TraceEvent, TraceEventsPayloads, TraceListener } from '../../types/public/tracing.js';

export type { TraceEvent, TraceEventsPayloads, TraceListener };

const listeners: TraceListener[] = [];

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
			return result instanceof Promise
				? // Return a promise that always resolve to void, but only once resultValue resolves.
					// This allow tracing listeners to await the completion of the inner function without
					// without having access to any internal values.
					result.then<void>(() => {})
				: undefined;
		});
	} catch {
		// Ignore errors in listeners to avoid breaking the main flow.
	}

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
