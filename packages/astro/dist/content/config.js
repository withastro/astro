import { AstroError, AstroErrorData, AstroUserError } from '../core/errors/index.js';
import { CONTENT_LAYER_TYPE, LIVE_CONTENT_TYPE } from './consts.js';
function getImporterFilename() {
	const stackLine = new Error().stack
		?.split('\n')
		.find(
			(line) =>
				!line.includes('defineCollection') &&
				!line.includes('defineLiveCollection') &&
				!line.includes('getImporterFilename') &&
				!line.startsWith('Error'),
		);
	if (!stackLine) {
		return void 0;
	}
	const match = /\/((?:src|chunks)\/.*?):\d+:\d+/.exec(stackLine);
	return match?.[1] ?? void 0;
}
function defineLiveCollection(config) {
	const importerFilename = getImporterFilename();
	if (importerFilename && !importerFilename.includes('live.config')) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Live collections must be defined in a `src/live.config.ts` file.',
				importerFilename ?? 'your content config file',
			),
		});
	}
	config.type ??= LIVE_CONTENT_TYPE;
	if (config.type !== LIVE_CONTENT_TYPE) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Collections in a live config file must have a type of `live`.',
				importerFilename,
			),
		});
	}
	if (!config.loader) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Live collections must have a `loader` defined.',
				importerFilename,
			),
		});
	}
	if (!config.loader.loadCollection || !config.loader.loadEntry) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Live collection loaders must have `loadCollection()` and `loadEntry()` methods. Please check that you are not using a loader intended for build-time collections',
				importerFilename,
			),
		});
	}
	if (typeof config.schema === 'function') {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'The schema cannot be a function for live collections. Please use a schema object instead.',
				importerFilename,
			),
		});
	}
	return config;
}
function defineCollection(config) {
	const importerFilename = getImporterFilename();
	if (importerFilename?.includes('live.config')) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Collections in a live config file must use `defineLiveCollection`.',
				importerFilename,
			),
		});
	}
	if ('loader' in config) {
		if (config.type && config.type !== CONTENT_LAYER_TYPE) {
			throw new AstroUserError(
				`A content collection is defined with legacy features (e.g. missing a \`loader\` or has a \`type\`). Check your collection definitions in ${importerFilename ?? 'your content config file'} to ensure that all collections are defined using the current properties.`,
			);
		}
		if (
			typeof config.loader === 'object' &&
			typeof config.loader.load !== 'function' &&
			('loadEntry' in config.loader || 'loadCollection' in config.loader)
		) {
			throw new AstroUserError(
				`Live content collections must be defined in "src/live.config.ts" file. Check the loaders used in "${importerFilename ?? 'your content config file'}" to ensure you are not using a live loader to define a build-time content collection.`,
			);
		}
		config.type = CONTENT_LAYER_TYPE;
	}
	if (!config.type) config.type = 'content';
	return config;
}
export { defineCollection, defineLiveCollection };
