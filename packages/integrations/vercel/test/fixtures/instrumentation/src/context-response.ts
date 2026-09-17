import { context, trace } from '@opentelemetry/api';

export async function contextResponse(): Promise<Response> {
	const beforeAwait = trace.getSpanContext(context.active());
	await new Promise((resolve) => setTimeout(resolve, 0));
	const afterAwait = trace.getSpanContext(context.active());

	return Response.json({
		contextSurvivedAwait:
			beforeAwait?.traceId === afterAwait?.traceId && beforeAwait?.spanId === afterAwait?.spanId,
		instrumentationRuns: globalThis.astroVercelInstrumentationRuns,
		spanId: afterAwait?.spanId,
		traceId: afterAwait?.traceId,
	});
}
