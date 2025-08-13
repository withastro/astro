import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { NodeSDK, tracing } from '@opentelemetry/sdk-node';

process.env.OTEL_PROPAGATORS ?? 'tracecontext,baggage,b3';
process.env.OTEL_TRACES_EXPORTER ?? 'otlp,console';
process.env.OTEL_METRICS_EXPORTER ?? 'otlp,console';
process.env.OTEL_LOGS_EXPORTER ?? 'otlp,console';

const sdk = new NodeSDK({
	autoDetectResources: true,
	serviceName: 'astro',
	// Always trace requests if the server is running directly.
	// It a proxy is running in front of the server and it has already
	// made a decision to trace the request or not, follow that decision.
	sampler: new tracing.ParentBasedSampler({
		root: new tracing.AlwaysOnSampler(),
	}),
	instrumentations: [
		new UndiciInstrumentation({ enabled: true }),
		new FetchInstrumentation({ enabled: true }),
	],
});

sdk.start();
