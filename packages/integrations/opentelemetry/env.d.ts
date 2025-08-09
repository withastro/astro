/// <reference types="astro/client" />

declare module 'astro:otel:api' {
	import * as api from '@opentelemetry/api';
	export = api;
}

declare module 'astro:otel:semantic-conventions' {
	import * as api from '@opentelemetry/semantic-conventions';
	export = api;
}

declare module 'astro:otel:node' {
	import { HttpInstrumentation, UndiciInstrumentation, FetchInstrumentation } from './otel-reexport/node.js';
	export { HttpInstrumentation, UndiciInstrumentation, FetchInstrumentation };
}

declare module 'astro:otel-internal' {
	import { Instrumentation } from '@opentelemetry/instrumentation';
	export const instrumentations: Instrumentation[];
}
