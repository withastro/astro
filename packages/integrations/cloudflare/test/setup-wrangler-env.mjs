/**
 * Wrangler / Miniflare write their dev registry, logs, and global config outside the
 * repo by default (see `getGlobalWranglerConfigPath` in wrangler/miniflare). That
 * breaks in locked-down environments and ignores `XDG_CONFIG_HOME` on Windows and
 * macOS (env-paths only honors XDG on non-Darwin Unix).
 *
 * Point all of that at package-local dirs: CI, sandboxes, and dev machines stay isolated.
 *
 * We only relocate the config root (via XDG / APPDATA+LOCALAPPDATA / HOME). Do not set
 * `WRANGLER_REGISTRY_PATH` here — a fixed path is shared by every Miniflare instance in
 * the process and can upset the Cloudflare Vite plugin lifecycle across fixtures.
 */
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheBase = join(packageRoot, 'node_modules', '.cache', 'cloudflare-test-wrangler');
mkdirSync(cacheBase, { recursive: true });

if (process.platform === 'win32') {
	const appData = join(cacheBase, 'win32', 'AppData', 'Roaming');
	const localAppData = join(cacheBase, 'win32', 'AppData', 'Local');
	mkdirSync(appData, { recursive: true });
	mkdirSync(localAppData, { recursive: true });
	process.env.APPDATA = appData;
	process.env.LOCALAPPDATA = localAppData;
} else if (process.platform === 'darwin') {
	// env-paths uses ~/Library/... for config on macOS, not XDG.
	const fakeHome = join(cacheBase, 'darwin-home');
	for (const segment of [
		['Library', 'Preferences'],
		['Library', 'Caches'],
		['Library', 'Logs'],
		['Library', 'Application Support'],
	]) {
		mkdirSync(join(fakeHome, ...segment), { recursive: true });
	}
	process.env.HOME = fakeHome;
} else {
	const xdgConfigHome = join(cacheBase, 'xdg-config');
	mkdirSync(xdgConfigHome, { recursive: true });
	process.env.XDG_CONFIG_HOME = xdgConfigHome;
}
