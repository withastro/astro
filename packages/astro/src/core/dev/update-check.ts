import { fetchPackageJson } from '../../cli/install-package.js';
import type { AstroPreferences } from '../../preferences/index.js';

let _latestVersion: string | undefined = undefined;

export async function fetchLatestAstroVersion(): Promise<string> {
	if (_latestVersion) {
		return _latestVersion;
	}

	const packageJson = await fetchPackageJson(undefined, 'astro', 'latest');
	if (packageJson instanceof Error) {
		throw packageJson;
	}

	const version = packageJson?.version;

	if (!version) {
		throw new Error('Failed to fetch latest Astro version');
	}

	_latestVersion = version;
	return version;
}

export async function shouldCheckForUpdates(preferences: AstroPreferences): Promise<boolean> {
	const hasCheckUpdatesEnabled = await preferences.get('checkUpdates.enabled');
	return process.env.ASTRO_DISABLE_UPDATE_CHECK !== 'true' && hasCheckUpdatesEnabled;
}
