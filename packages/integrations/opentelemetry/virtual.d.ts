declare module 'astro:otel:logger' {
	import { Logger } from '@opentelemetry/api-logs';
	const logger: Logger;
	export default logger;
}

declare module 'astro:otel:tracer' {
	import { Tracer } from '@opentelemetry/api';
	const tracer: Tracer;
	export default tracer;
}

declare module 'astro:otel:meter' {
	import { Meter } from '@opentelemetry/api';
	const meter: Meter;
	export default meter;
}
