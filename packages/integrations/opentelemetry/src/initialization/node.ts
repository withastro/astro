import { site } from 'astro:config/server';
import { instrumentations } from 'astro:otel-internal';
import {
	FetchInstrumentation,
	HttpInstrumentation,
	UndiciInstrumentation,
} from 'astro:otel-reexport:node';
import { NodeSDK, tracing } from '@opentelemetry/sdk-node';

process.env.OTEL_PROPAGATORS ?? 'tracecontext,baggage,b3';
process.env.OTEL_TRACES_EXPORTER ?? 'otlp';
process.env.OTEL_METRICS_EXPORTER ?? 'otlp';
process.env.OTEL_LOGS_EXPORTER ?? 'otlp,console';

const sdk = new NodeSDK({
	autoDetectResources: true,
	serviceName: site || 'astro',
	// Always trace requests if the server is running directly.
	// It a proxy is running in front of the server and it has already
	// made a decision to trace the request or not, follow that decision.
	sampler: new tracing.ParentBasedSampler({
		root: new tracing.AlwaysOnSampler(),
	}),
	instrumentations: [
		new HttpInstrumentation({
			enabled: true,
			serverName: site || 'astro',
			enableSyntheticSourceDetection: true,
			requireParentforIncomingSpans: false,
			requireParentforOutgoingSpans: true,
		}),
		new UndiciInstrumentation({ enabled: true }),
		new FetchInstrumentation({ enabled: true }),
		...instrumentations,
	],
});

sdk.start();
