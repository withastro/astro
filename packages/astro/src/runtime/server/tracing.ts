import { EventEmitter, captureRejectionSymbol } from "node:events";
import type { TraceEvents, TraceListener } from "../../types/public/tracing.js";

type EventArgs = {
	[K in keyof TraceEvents]: [event: K, payload: TraceEvents[K]];
}[keyof TraceEvents];

const tracingEvents = new EventEmitter<{
	before: EventArgs,
	after: EventArgs,
}>({ captureRejections: true });

// Log errors on trace listeners to the console
tracingEvents[captureRejectionSymbol] = console.error;

let tracingEnabled = false;

export function onBeforeTrace(listener: TraceListener) {
	tracingEnabled = true;
	tracingEvents.on('before', listener);
}

export function onAfterTrace(listener: TraceListener) {
	tracingEnabled = false;
	tracingEvents.on('after', listener);
}

export function wrapWithTracing<This, Args extends any[], Return, Event extends keyof TraceEvents>(
	event: Event,
	fn: (this: This, ...args: Args) => Return,
	payload: TraceEvents[Event] | ((this: This, ...args: Args) => TraceEvents[Event]),
): (this: This, ...args: Args) => Return {
	return function (this: This, ...args: Args): Return {
		if (tracingEnabled) {
			// Avoid constructing payloads and emitting events if no listeners are attached
			return fn.apply(this, args);
		}

		const eventArgs = [
			event,
			typeof payload === 'function' ? payload.apply(this, args) : payload,
		] as EventArgs;
		tracingEvents.emit('before', ...eventArgs);
		const result = fn.apply(this, args);
		tracingEvents.emit('after', ...eventArgs);
		return result;
	};
}
