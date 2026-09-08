import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { UnableToLoadLogger } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { normalizeLoggerConfig, type NormalizedLoggerConfig } from './utils.js';

export const VIRTUAL_LOGGER_ID = 'virtual:astro:logger';
const RESOLVED_VIRTUAL_LOGGER_ID = '\0' + VIRTUAL_LOGGER_ID;

/** Resolves an entrypoint to a module id, or `null` if it cannot be resolved. */
type ResolveEntrypoint = (entrypoint: string) => Promise<string | null>;

interface EmittedDestination {
	/** The expression instantiating the destination, e.g. `_logger0({ level: 'info' })` */
	expression: string;
	/** The import statements `expression` depends on, in declaration order */
	imports: string[];
}

/**
 * Emits the source of a logger destination, so that the handler is part of the bundle
 * rather than imported at runtime from a path that no longer exists once deployed.
 *
 * This is the build-time counterpart of `createDestination()` in `./load.ts`: both walk
 * the same normalized config, but this one *generates code* that instantiates the
 * destination, while the Node one instantiates it directly through `import()`.
 */
export async function emitDestination(
	config: NormalizedLoggerConfig,
	resolveEntrypoint: ResolveEntrypoint,
	/**
	 * Import names must be unique across the whole virtual module, so nested
	 * destinations continue numbering where their parent left off.
	 */
	nameOffset = 0,
): Promise<EmittedDestination> {
	let resolved: string | null = null;
	let cause: unknown;
	try {
		resolved = await resolveEntrypoint(config.entrypoint);
	} catch (e) {
		// Resolution can throw for invalid package specifiers, while an entrypoint that
		// simply cannot be found resolves to `null`. Both mean the same thing here.
		cause = e;
	}
	if (!resolved) {
		const error = new AstroError({
			...UnableToLoadLogger,
			message: UnableToLoadLogger.message(config.entrypoint),
		});
		if (cause instanceof Error) {
			error.cause = cause;
		}
		throw error;
	}

	const name = `_logger${nameOffset}`;
	const imports = [`import ${name} from ${JSON.stringify(resolved)};`];

	// `astro/logger/compose` takes the composed destinations rather than
	// a serializable config, so its children are instantiated inline.
	if (config.loggers) {
		const expressions: string[] = [];
		for (const nested of config.loggers) {
			const emitted = await emitDestination(nested, resolveEntrypoint, nameOffset + imports.length);
			imports.push(...emitted.imports);
			expressions.push(emitted.expression);
		}
		return { expression: `${name}([${expressions.join(', ')}])`, imports };
	}

	return { expression: `${name}(${JSON.stringify(config.config) ?? 'undefined'})`, imports };
}

/**
 * Emits `virtual:astro:logger`: the configured destination as the default export
 * (`null` when the user configured none) plus the resolved log level.
 *
 * The module is always registered, even without a `logger` config, so that code
 * generated ahead of the user's config — `astro:content`, which is built from a
 * static template — can import it unconditionally. It deliberately imports
 * nothing but the user's destination entrypoint: unlike `virtual:astro:manifest`
 * it is a leaf, so reaching a logger through it cannot pull renderers and pages
 * into an importer's module graph.
 */
export function vitePluginLogger({ settings }: { settings: AstroSettings }): VitePlugin {
	const loggerConfig = settings.config.logger;

	return {
		name: VIRTUAL_LOGGER_ID,
		enforce: 'pre',

		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_LOGGER_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_LOGGER_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_LOGGER_ID}$`),
			},
			async handler() {
				const level = `export const level = ${JSON.stringify(settings.logLevel)};\n`;
				if (!loggerConfig) {
					return { code: `${level}export default null;\n` };
				}
				// Use the project root as the importer so that user-provided handlers
				// resolve from the project's node_modules, not from astro core's location.
				const importerPath = fileURLToPath(new URL('package.json', settings.config.root));
				const { expression, imports } = await emitDestination(
					normalizeLoggerConfig(loggerConfig, settings.config.root),
					async (entrypoint) => (await this.resolve(entrypoint, importerPath))?.id ?? null,
				);

				return {
					code: `${imports.join('\n')}\n${level}export default ${expression};\n`,
				};
			},
		},
	};
}
