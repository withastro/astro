import type {
	TraceEvent,
	TraceEventsPayloads,
	TraceListener,
	TraceWrapListener,
} from '../../types/public/tracing.js';

export type { TraceEvent, TraceEventsPayloads, TraceListener, TraceWrapListener };

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

const wrapListeners: TraceWrapListener[] = [];

export function onTraceEvent(listener: TraceWrapListener, signal?: AbortSignal) {
	if (signal) {
		if (signal.aborted) {
			// The signal is already aborted, the listener should never be called.
			// Returning early avoids both possible scenarios:
			// - The `abort` event is being processed and the listener would be removed depending on a race condition.
			// - The `abort` signal was already processed and the listener will never be removed, triggering after the signal is aborted.
			return;
		}
		signal.addEventListener('abort', () => {
			wrapListeners.splice(wrapListeners.indexOf(listener), 1);
		});
	}

	wrapListeners.push(listener);
}

function wrapCall<T>(event: TraceEvent, fn: () => T, index = 0): T {
	if (index >= wrapListeners.length) {
		return fn();
	}

	const listener = wrapListeners[index];
	return listener(event, () => wrapCall(event, fn, index + 1));
}

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
	return function (this: This, ...args: Args): Return {
		if (
			eventLifecycle.before.length === 0 &&
			eventLifecycle.onComplete.length === 0 &&
			eventLifecycle.after.length === 0 &&
			wrapListeners.length === 0
		) {
			// Avoid constructing payloads and emitting events if no listeners are attached
			return fn.apply(this, args);
		}

		const eventArgs = {
			event,
			payload: typeof payload === 'function' ? payload.apply(this, args) : payload,
		} as TraceEvent;

		for (const listener of eventLifecycle.before) {
			listener(eventArgs);
		}

		let result =
			wrapListeners.length === 0
				? fn.apply(this, args)
				: wrapCall(eventArgs, () => fn.apply(this, args));

		if (result instanceof Promise) {
			if (eventLifecycle.onComplete.length > 0) {
				// Only attach a `finally` handler if there are onComplete listeners.
				// This avoids unnecessary entries on the event loop when tracing implementations don't use the `onComplete` hook.
				result = result.finally(() => {
					// Call hook after the async operation completes
					for (const listener of eventLifecycle.onComplete) {
						listener(eventArgs);
					}
				}) as /* Safe to cast because Promise.finally doesn't change the resolved or thrown value. */ Return;
			}
		} else {
			// Operation was synchronous, call onComplete listeners immediately
			for (const listener of eventLifecycle.onComplete) {
				listener(eventArgs);
			}
		}

		for (const listener of eventLifecycle.after) {
			listener(eventArgs);
		}

		return result;
	};
}
