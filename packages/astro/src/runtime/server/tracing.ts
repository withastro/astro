import type { TraceEvents, TraceListener } from '../../types/public/tracing.js';

type EventArgs = {
	[K in keyof TraceEvents]: [event: K, payload: TraceEvents[K]];
}[keyof TraceEvents];

type OperationLifecycle = 'before' | 'onComplete' | 'after';

const eventLifecycle: Record<OperationLifecycle, TraceListener[]> = {
	before: [],
	onComplete: [],
	after: [],
};

function onTrace(lifecycle: OperationLifecycle, listener: TraceListener, signal?: AbortSignal) {
	const wrapped: TraceListener = (...args) => {
		try {
			const res: unknown = listener(...args);
			// Attach an error handler to avoid unhandled promise rejections
			if (res instanceof Promise) res.catch(console.error);
		} catch (error) {
			console.error(error);
		}
	};

	const listeners = eventLifecycle[lifecycle];

	if (signal) {
		if (signal.aborted) {
			// The signal is already aborted, the listener should never be called.
			// Returning early avoids both possible scenarios:
			// - The `abort` event is being processed and the listener would be removed depending on a race condition.
			// - The `abort` signal was already processed and the listener will never be removed, triggering after the signal is aborted.
			return;
		}
		signal.addEventListener('abort', () => {
			listeners.splice(listeners.indexOf(wrapped), 1);
		});
	}

	listeners.push(wrapped);
}

/**
 * @experimental
 */
export function onBeforeTrace(listener: TraceListener, signal?: AbortSignal) {
	onTrace('before', listener, signal);
}

/**
 * @experimental
 */
export function onCompleteTrace(listener: TraceListener, signal?: AbortSignal) {
	onTrace('onComplete', listener, signal);
}

/**
 * @experimental
 */
export function onAfterTrace(listener: TraceListener, signal?: AbortSignal) {
	onTrace('after', listener, signal);
}

export function wrapWithTracing<This, Args extends any[], Return, Event extends keyof TraceEvents>(
	event: Event,
	fn: (this: This, ...args: Args) => Return,
	payload: TraceEvents[Event] | ((this: This, ...args: Args) => TraceEvents[Event]),
): (this: This, ...args: Args) => Return {
	return function (this: This, ...args: Args): Return {
		if (
			eventLifecycle.before.length === 0 &&
			eventLifecycle.onComplete.length === 0 &&
			eventLifecycle.after.length === 0
		) {
			// Avoid constructing payloads and emitting events if no listeners are attached
			return fn.apply(this, args);
		}

		const eventArgs = [
			event,
			typeof payload === 'function' ? payload.apply(this, args) : payload,
		] as EventArgs;

		for (const listener of eventLifecycle.before) {
			listener(...eventArgs);
		}

		let result = fn.apply(this, args);

		if (result instanceof Promise) {
			if (eventLifecycle.onComplete.length > 0) {
				// Only attach a `finally` handler if there are onComplete listeners.
				// This avoids unnecessary entries on the event loop when tracing implementations don't use the `onComplete` hook.
				result = result.finally(() => {
					// Call hook after the async operation completes
					for (const listener of eventLifecycle.onComplete) {
						listener(...eventArgs);
					}
				}) as /* Safe to cast because Promise.finally doesn't change the resolved or thrown value. */ Return;
			}
		} else {
			// Operation was synchronous, call onComplete listeners immediately
			for (const listener of eventLifecycle.onComplete) {
				listener(...eventArgs);
			}
		}

		for (const listener of eventLifecycle.after) {
			listener(...eventArgs);
		}

		return result;
	};
}
