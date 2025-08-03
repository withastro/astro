import type { AstroIntegration } from 'astro';

export default function openTelemetry(): AstroIntegration {
	return {
		name: '@astrojs/opentelemetry',
		hooks: {
			'astro:config:setup': ({ updateConfig, addInitializer }) => {
				console.log('Setting up OpenTelemetry integration for Astro...');

				updateConfig({
					vite: {
						ssr: {
							external: [
								'@astrojs/opentelemetry/initOpentelemetry',
								'astro',
								'@opentelemetry/api',
								'@opentelemetry/sdk-node',
								'@opentelemetry/exporter-trace-otlp-http',
								'@opentelemetry/instrumentation-http',
							],
						},
					},
				});

				addInitializer('@astrojs/opentelemetry/initOpentelemetry');
			},
		},
	};
}
