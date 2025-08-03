import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { api, NodeSDK, tracing } from '@opentelemetry/sdk-node';
import { onTraceEvent, type TraceEvent } from 'astro/runtime/server/tracing.js';

// TODO: Make the types load
// @ts-ignore
// import { site } from 'astro:config/server';

api.diag.setLogger(new api.DiagConsoleLogger(), {
	logLevel: api.DiagLogLevel.WARN,
});

console.log('Initializing OpenTelemetry SDK for Astro...');

const contextManager = new AsyncLocalStorageContextManager();

const sdk = new NodeSDK({
	contextManager,
	autoDetectResources: true,
	serviceName: 'astro',
	sampler: new tracing.AlwaysOnSampler(),
	instrumentations: [new HttpInstrumentation({ enabled: true })],
	spanProcessors: [new tracing.SimpleSpanProcessor(new OTLPTraceExporter({}))],
});

// TS claims this doesn't need await, but it does.
// TODO: Link the issue later
await sdk.start();
const tracer = api.trace.getTracer('astro');

function getEventAttributes(event: TraceEvent): api.Attributes {
	switch (event.event) {
		case 'instantiateComponent':
			return {
				'astro.component.displayName': event.payload.displayName,
				'astro.component.name': event.payload.componentName,
				'astro.component.module': event.payload.moduleId,
			};
		case 'componentFrontmatter':
			return {
				'astro.component.name': event.payload.name,
				'astro.component.module': event.payload.moduleId,
			};
		case 'componentRender':
			return {
				'astro.component.displayName': event.payload.displayName,
				'astro.component.name': event.payload.componentName,
				'astro.component.module': event.payload.moduleId,
			};
		case 'slotRender':
			return {
				'astro.component.name': event.payload.componentName,
				'astro.component.module': event.payload.componentModuleId,
				'astro.slot.name': event.payload.slotName,
			};
		case 'routeRender':
			return {
				'astro.route.rootModuleId': event.payload.rootModuleId,
				'astro.route.pathname': event.payload.pathname,
				'astro.route.url': event.payload.url.toString(),
				'astro.route.pattern': event.payload.routeData.route,
				'astro.route.type': event.payload.routeData.type,
				'astro.partial': event.payload.partial,
			};
		default:
			return {};
	}
}

onTraceEvent(<T>(event: TraceEvent, cb: () => T): T => {
	return tracer.startActiveSpan(
		event.event,
		{
			attributes: getEventAttributes(event),
			kind: api.SpanKind.SERVER,
		},
		(span): T => {
			try {
				const res = cb();
				if (res instanceof Promise) {
					return res.finally(() => {
						span.end();
					}) as T;
				}

				span.setStatus({ code: api.SpanStatusCode.OK }).end();
				return res;
			} catch (error) {
				if (error instanceof Error) {
					span.recordException({
						name: error.name,
						stack: error.stack,
						message: error.message,
					});
				}

				span
					.setStatus({
						code: api.SpanStatusCode.ERROR,
						message: error instanceof Error ? error.message : String(error),
					})
					.end();

				throw error;
			}
		},
	);
});
