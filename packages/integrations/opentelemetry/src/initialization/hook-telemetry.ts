import * as api from 'astro:otel:api';
import * as sc from 'astro:otel:semantic-conventions';
import { onTraceEvent, type TraceEvent } from 'astro/runtime/server/tracing.js';

const PACKAGE_VERSION = process.env.PACKAGE_VERSION ?? 'development';
const tracer = api.trace.getTracer('@astrojs/opentelemetry', PACKAGE_VERSION);

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
				'astro.route.type': event.payload.routeData.type,
				'astro.partial': event.payload.partial,
				[sc.ATTR_CLIENT_ADDRESS]: event.payload.clientAddress,
				[sc.ATTR_URL_FULL]: event.payload.url.toString(),
				[sc.ATTR_URL_PATH]: event.payload.pathname,
				[sc.ATTR_HTTP_ROUTE]: event.payload.routeData.route,
				[sc.ATTR_HTTP_REQUEST_METHOD]: event.payload.request.method,
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
