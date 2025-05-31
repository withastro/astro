import type { TraceEvents, TraceListener } from '../../types/public/tracing.js';

type EventArgs = {
	[K in keyof TraceEvents]: [event: K, payload: TraceEvents[K]];
}[keyof TraceEvents];

const eventLifecycle: Record<'before' | 'after', TraceListener[]> = {
	before: [],
	after: [],
};

function onTrace(lifecycle: 'before' | 'after', listener: TraceListener, signal?: AbortSignal) {
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
	listeners.push(wrapped);
	if (signal) {
		signal.addEventListener('abort', () => {
			listeners.splice(listeners.indexOf(wrapped), 1);
		});
	}
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
export function onAfterTrace(listener: TraceListener, signal?: AbortSignal) {
	onTrace('after', listener, signal);
}

export function wrapWithTracing<This, Args extends any[], Return, Event extends keyof TraceEvents>(
	event: Event,
	fn: (this: This, ...args: Args) => Return,
	payload: TraceEvents[Event] | ((this: This, ...args: Args) => TraceEvents[Event]),
): (this: This, ...args: Args) => Return {
	return function (this: This, ...args: Args): Return {
		if (eventLifecycle.before.length === 0 && eventLifecycle.after.length === 0) {
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

		const result = fn.apply(this, args);

		for (const listener of eventLifecycle.before) {
			listener(...eventArgs);
		}

		return result;
	};
}
