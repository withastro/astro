import type { AstroIntegration } from 'astro';
import { AstroError } from 'astro/errors';
import { z } from 'astro/zod';
import { fileURLToPath } from 'node:url';
import { otelApis } from './vite/otel-apis.js';
import { otelInternalApis } from './vite/otel-internal.js';
import { otelHelper } from './vite/otel-helper.js';

const optionsSchema = z.object({
	/**
	 * The OpenTelemetry API initialization module to use.
	 * This should be a path to a module that configures the global context, meter, tracer and logger providers.
	 *
	 * If not specified, the integration will try to determine the correct one based on the adapter.
	 * If set to `false`, no API initialization will be performed, only the instruments will be registered.
	 */
	apiInitialization: z.union([z.string(), z.literal(false)]).optional(),

	/**
	 * Module configuring OpenTelemetry instrumentation.
	 *
	 * This should be a path to a module that exports an array of `Instrumentation` instances from
	 * `@opentelemetry/instrumentation` as the default export.
	 * It will be loaded after the API initialization module (if any) and before the hook telemetry module.
	 *
	 * This can be used to configure library instrumentations with environment patching.
	 */
	instrumentationModule: z.string().optional(),

	/**
	 * The module specifier prefix to use for re-exporting OpenTelemetry APIs.
	 *
	 * This should be set by integrations that wrap this OpenTelemetry integration to ensure imports
	 * from virtual modules can resolve to transitive dependencies.
	 *
	 * Default: `@astrojs/opentelemetry/otel-reexport`
	 */
	reexportPrefix: z.string().optional().default('@astrojs/opentelemetry/otel-reexport'),
})
	.optional()
	.default({});

const adapterModule: Record<string, string> = {
	'@astrojs/node': import.meta.resolve('./initialization/node.js'),
}

export default function openTelemetry(options?: z.input<typeof optionsSchema>): AstroIntegration {
	const parsedOptions = optionsSchema.parse(options);

	return {
		name: '@astrojs/opentelemetry',
		hooks: {
			'astro:config:setup': async ({ command, config, updateConfig, addInitializer, logger }) => {
				if (command !== 'dev' && command !== 'build') {
					// This integration is only relevant for dev and build commands
					return;
				}

				logger.debug('Setting up OpenTelemetry for Astro...');

				updateConfig({
					vite: {
						plugins: [
							otelApis({ logger, reexportPrefix: parsedOptions.reexportPrefix }),
							otelInternalApis({
								logger,
								instrumentationModule: parsedOptions.instrumentationModule?.startsWith('.')
									? fileURLToPath(new URL(parsedOptions.instrumentationModule, config.root))
									: parsedOptions.instrumentationModule,
							}),
							otelHelper(),
						],
					},
				});

				if (parsedOptions.apiInitialization === false) {
					logger.info('OpenTelemetry API initialization is disabled. Only instrumentation will be registered.');
				} else if (command === 'build') {
					const adapterName = config.adapter?.name;

					if (!adapterName) {
						throw new AstroError(
							'OpenTelemetry integration requires an adapter to be configured.',
							// TODO: Link to docs on hint
						)
					}

					const adapterInitializer = adapterModule[adapterName];

					if (parsedOptions.apiInitialization && adapterInitializer) {
						logger.info(`Overriding initialization for the "${adapterName}" adapter with "${parsedOptions.apiInitialization}".`);
					}

					const initializer = parsedOptions.apiInitialization || adapterInitializer;

					if (!initializer) {
						throw new AstroError(
							`OpenTelemetry integration doesn't provide automatic initialization for the "${adapterName}" adapter. You must provide a custom API initialization module or explicitly disable API initialization.`,
							// TODO: Link to docs on hint
						);
					}

					addInitializer(initializer);
				}

				logger.info('Registering OpenTelemetry hook telemetry module.');
				addInitializer(import.meta.resolve('./initialization/hook-telemetry.js'));
			},
		},
	};
}
