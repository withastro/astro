import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PREFERENCES } from './defaults.js';
import dget from './dlv.js';
import { PreferenceStore } from './store.js';
function isValidKey(key) {
	return dget(DEFAULT_PREFERENCES, key) !== void 0;
}
function coerce(key, value) {
	const type = typeof dget(DEFAULT_PREFERENCES, key);
	switch (type) {
		case 'string':
			return value;
		case 'number':
			return Number(value);
		case 'boolean': {
			if (value === 'true' || value === 1) return true;
			if (value === 'false' || value === 0) return false;
			break;
		}
		default:
			throw new Error(`Incorrect value for ${key}`);
	}
	return value;
}
function createPreferences(config, dotAstroDir) {
	const global = new PreferenceStore(getGlobalPreferenceDir());
	const project = new PreferenceStore(fileURLToPath(dotAstroDir));
	const stores = { global, project };
	return {
		async get(key, { location } = {}) {
			if (!location) return project.get(key) ?? global.get(key) ?? dget(DEFAULT_PREFERENCES, key);
			return stores[location].get(key);
		},
		async set(key, value, { location = 'project', reloadServer = true } = {}) {
			stores[location].set(key, value);
			if (!reloadServer) {
				this.ignoreNextPreferenceReload = true;
			}
		},
		async getAll() {
			const allPrefs = Object.assign(
				{},
				DEFAULT_PREFERENCES,
				stores['global'].getAll(),
				stores['project'].getAll(),
			);
			const { _variables, ...prefs } = allPrefs;
			return prefs;
		},
		async list() {
			const { _variables, ...defaultPrefs } = DEFAULT_PREFERENCES;
			return {
				global: stores['global'].getAll(),
				project: stores['project'].getAll(),
				fromAstroConfig: mapFrom(DEFAULT_PREFERENCES, config),
				defaults: defaultPrefs,
			};
			function mapFrom(defaults, astroConfig) {
				return Object.fromEntries(
					Object.entries(defaults).map(([key, _]) => [key, astroConfig[key]]),
				);
			}
		},
		ignoreNextPreferenceReload: false,
	};
}
function getGlobalPreferenceDir() {
	const name = 'astro';
	const homedir = os.homedir();
	const macos = () => path.join(homedir, 'Library', 'Preferences', name);
	const win = () => {
		const { APPDATA = path.join(homedir, 'AppData', 'Roaming') } = process.env;
		return path.join(APPDATA, name, 'Config');
	};
	const linux = () => {
		const { XDG_CONFIG_HOME = path.join(homedir, '.config') } = process.env;
		return path.join(XDG_CONFIG_HOME, name);
	};
	switch (process.platform) {
		case 'darwin':
			return macos();
		case 'win32':
			return win();
		default:
			return linux();
	}
}
export { coerce, createPreferences as default, isValidKey };
