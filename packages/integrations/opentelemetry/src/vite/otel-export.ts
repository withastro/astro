import type { AstroIntegrationLogger } from 'astro';
import type { Plugin } from 'vite';

export function otelReexport({
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
		name: '@astrojs/opentelemetry/otel-reexport',
		enforce: 'pre',
		async resolveId(id) {
			if (id.startsWith(reexportPrefix)) {
				logger.debug(`Externalizing OpenTelemetry dependency: ${id}`);
				const resolvedId = await this.resolve(id);

				return resolvedId && {
					...resolvedId,
					external: true,
				};
			}

			if (id.startsWith('astro:otel-reexport:')) {
				const reexportName = id.slice('astro:otel-reexport:'.length);
				logger.debug(`Rewriting OpenTelemetry re-export: ${reexportName}`);

				const baseId = `${reexportPrefix}/${reexportName}`;
				const resolvedId = await this.resolve(baseId);

				return resolvedId && {
					...resolvedId,
					external: true,
				};
			}
		},
	};
}
