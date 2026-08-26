import { context, propagation } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

declare global {
	var astroVercelInstrumentationRuns: number | undefined;
	var resetAstroVercelOpenTelemetry: (() => void) | undefined;
}

export async function register() {
	await Promise.resolve();

	globalThis.astroVercelInstrumentationRuns =
		(globalThis.astroVercelInstrumentationRuns ?? 0) + 1;

	context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
	propagation.setGlobalPropagator(new W3CTraceContextPropagator());

	globalThis.resetAstroVercelOpenTelemetry = () => {
		context.disable();
		propagation.disable();
		globalThis.astroVercelInstrumentationRuns = undefined;
	};
}
