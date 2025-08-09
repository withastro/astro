import type { AstroIntegrationLogger } from "astro";
import type { Plugin } from "vite";

const MODULE_ID = 'astro:otel-internal';
const RESOLVED_ID = '\0' + MODULE_ID;

export function otelInternalApis({ instrumentationModule }: {
	instrumentationModule?: string;
	logger: AstroIntegrationLogger
}): Plugin {
	return {
		name: "@astrojs/opentelemetry/internal",
		resolveId(id) {
			if (id === MODULE_ID) return RESOLVED_ID;
		},
		load(id) {
			if (id !== RESOLVED_ID) return;

			const parts: string[] = [];

			if (instrumentationModule) {
				parts.push(`export const instrumentations = await import(${JSON.stringify(instrumentationModule)}).then(m => m.default);`);
			} else {
				parts.push(`export const instrumentations = [];`);
			}

			return parts.join('\n');
		}
	};
}
