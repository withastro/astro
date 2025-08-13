import { URLSearchParams } from 'node:url';
import type { Plugin } from 'vite';

const LOGGER_ID = 'astro:otel:logger';
const TRACER_ID = 'astro:otel:tracer';
const METER_ID = 'astro:otel:meter';

const LOGGER_RESOLVED_ID = '\0' + LOGGER_ID;
const TRACER_RESOLVED_ID = '\0' + TRACER_ID;
const METER_RESOLVED_ID = '\0' + METER_ID;

const resolveMapping: Record<string, string> = {
	[LOGGER_ID]: LOGGER_RESOLVED_ID,
	[TRACER_ID]: TRACER_RESOLVED_ID,
	[METER_ID]: METER_RESOLVED_ID,
};

export function otelHelper(): Plugin {
	return {
		name: '@astrojs/opentelemetry/otel-helper',
		enforce: 'pre',
		async resolveId(id, importer) {
			const resolved = resolveMapping[id];
			if (!resolved) return null;

			return `${resolved}?${new URLSearchParams({ importer: importer || '' })}`;
		},
		load(id) {
			if (!Object.values(resolveMapping).some((resolvedId) => id.startsWith(resolvedId))) {
				return null;
			}

			const [resolvedId, query] = id.split('?');
			const component = resolvedId.slice('\0astro:otel:'.length);
			const params = new URLSearchParams(query);
			const importer = params.get('importer') || 'unknown';

			switch (component) {
				case 'logger':
					return `
import { logs } from 'astro:otel-reexport:api-logs';
const logger = logs.getLogger(${JSON.stringify(importer)});
export default logger;
					`.trim();
				case 'tracer':
					return `
import { trace } from 'astro:otel-reexport:api';
const tracer = trace.getTracer(${JSON.stringify(importer)});
export default tracer;
					`.trim();
				case 'meter':
					return `
import { metrics } from 'astro:otel-reexport:api';
const meter = api.metrics.getMeter(${JSON.stringify(importer)});
export default meter;
					`.trim();
				default:
					return null;
			}
		},
	};
}
