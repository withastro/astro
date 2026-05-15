import ci from 'ci-info';
import { fetchPackageJson } from '../../cli/install-package.js';
const MAX_PATCH_DISTANCE = 5;
const CHECK_MS_INTERVAL = 10368e5;
let _latestVersion = void 0;
async function fetchLatestAstroVersion(preferences) {
	if (_latestVersion) {
		return _latestVersion;
	}
	const packageJson = await fetchPackageJson(void 0, 'astro', 'latest');
	if (packageJson instanceof Error) {
		throw packageJson;
	}
	const version = packageJson?.version;
	if (!version) {
		throw new Error('Failed to fetch latest Astro version');
	}
	if (preferences) {
		await preferences.set('_variables.lastUpdateCheck', Date.now(), { reloadServer: false });
	}
	_latestVersion = version;
	return version;
}
async function shouldCheckForUpdates(preferences) {
	if (ci.isCI) {
		return false;
	}
	const timeSinceLastCheck = Date.now() - (await preferences.get('_variables.lastUpdateCheck'));
	const hasCheckUpdatesEnabled = await preferences.get('checkUpdates.enabled');
	return (
		timeSinceLastCheck > CHECK_MS_INTERVAL &&
		process.env.ASTRO_DISABLE_UPDATE_CHECK !== 'true' &&
		hasCheckUpdatesEnabled
	);
}
export { MAX_PATCH_DISTANCE, fetchLatestAstroVersion, shouldCheckForUpdates };
