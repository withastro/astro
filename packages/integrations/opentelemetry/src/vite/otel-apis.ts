import type { AstroIntegrationLogger } from 'astro';
import type { Plugin } from 'vite';

export function otelApis({
	logger,
	reexportPrefix,
}: {
	logger: AstroIntegrationLogger;
	reexportPrefix: string;
}): Plugin {
	return {
		// All OpenTelemetry dependencies have to be externalized due
		// to how they handles internal state relying on global variables
		// and singletons. Vite cannot handle this properly and breaks
		// the OpenTelemetry tracking otherwise.
		// This serves as a workaround for conflicting expectations and restrictions between
		// strict dependency management, vite and OpenTelemetry.
		name: '@astrojs/opentelemetry/otel-apis',
		enforce: 'pre',
		async resolveId(id) {
			if (id.startsWith(reexportPrefix)) {
				logger.debug(`Externalizing OpenTelemetry dependency: ${id}`);
				return { id, external: true };
			}

			if (id.startsWith('astro:otel:')) {
				const reexportName = id.slice('astro:otel:'.length);
				logger.debug(`Rewriting OpenTelemetry re-export: ${reexportName}`);

				return {
					id: `${reexportPrefix}/${reexportName}`,
					external: true,
				};
			}
		},
	};
}
