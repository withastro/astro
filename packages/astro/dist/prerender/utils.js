import { getOutDirWithinCwd } from '../core/build/common.js';
function getPrerenderDefault(config) {
	return config.output !== 'server';
}
function getServerOutputDirectory(settings) {
	return settings.buildOutput === 'server'
		? settings.config.build.server
		: getOutDirWithinCwd(settings.config.outDir);
}
function getPrerenderOutputDirectory(settings) {
	return new URL('./.prerender/', getServerOutputDirectory(settings));
}
function getClientOutputDirectory(settings) {
	const preserveStructure = settings.adapter?.adapterFeatures?.preserveBuildClientDir;
	if (settings.buildOutput === 'server' || preserveStructure) {
		return settings.config.build.client;
	}
	return settings.config.outDir;
}
export {
	getClientOutputDirectory,
	getPrerenderDefault,
	getPrerenderOutputDirectory,
	getServerOutputDirectory,
};
