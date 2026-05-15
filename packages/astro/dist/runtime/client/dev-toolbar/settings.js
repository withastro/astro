import { isValidPlacement } from './ui-library/window.js';
const defaultSettings = {
	disableAppNotification: false,
	verbose: false,
	placement: 'bottom-center',
};
const settings = getSettings();
function getSettings() {
	let _settings = { ...defaultSettings };
	const configPlacement = globalThis.__astro_dev_toolbar__?.placement;
	if (configPlacement && isValidPlacement(configPlacement)) {
		_settings.placement = configPlacement;
	}
	const toolbarSettings = localStorage.getItem('astro:dev-toolbar:settings');
	if (toolbarSettings) {
		_settings = { ..._settings, ...JSON.parse(toolbarSettings) };
	}
	function updateSetting(key, value) {
		_settings[key] = value;
		localStorage.setItem('astro:dev-toolbar:settings', JSON.stringify(_settings));
	}
	function log(message, level = 'log') {
		console[level](
			`%cAstro`,
			'background: linear-gradient(66.77deg, #D83333 0%, #F041FF 100%); color: white; padding-inline: 4px; border-radius: 2px; font-family: monospace;',
			message,
		);
	}
	return {
		get config() {
			return _settings;
		},
		updateSetting,
		logger: {
			log,
			warn: (message) => {
				log(message, 'warn');
			},
			error: (message) => {
				log(message, 'error');
			},
			verboseLog: (message) => {
				if (_settings.verbose) {
					log(message);
				}
			},
		},
	};
}
export { defaultSettings, settings };
