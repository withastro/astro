import { loadEnv } from 'vite';
import './types.js';
function getAstroEnv(envMode = '') {
	const env = loadEnv(envMode, process.cwd(), 'ASTRO_');
	return env;
}
function getRemoteDatabaseInfo() {
	const astroEnv = getAstroEnv();
	return {
		url: astroEnv.ASTRO_DB_REMOTE_URL,
		token: astroEnv.ASTRO_DB_APP_TOKEN,
	};
}
function resolveDbAppToken(flags, envToken) {
	const dbAppToken = flags.dbAppToken;
	if (typeof dbAppToken === 'string') return dbAppToken;
	return envToken;
}
function getDbDirectoryUrl(root) {
	return new URL('db/', root);
}
function defineDbIntegration(integration) {
	return integration;
}
function mapObject(item, callback) {
	return Object.fromEntries(
		Object.entries(item).map(([key, value]) => [key, callback(key, value)]),
	);
}
export {
	defineDbIntegration,
	getAstroEnv,
	getDbDirectoryUrl,
	getRemoteDatabaseInfo,
	mapObject,
	resolveDbAppToken,
};
