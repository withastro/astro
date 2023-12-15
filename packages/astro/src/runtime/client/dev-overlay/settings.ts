export interface Settings {
	disablePluginNotification: boolean;
	verbose: boolean;
}

export const defaultSettings = {
	disablePluginNotification: false,
	verbose: false,
} satisfies Settings;

export const settings = getSettings();

function getSettings() {
	let _settings: Settings = { ...defaultSettings };
	const overlaySettings = localStorage.getItem('astro:dev-overlay:settings');

	if (overlaySettings) {
		_settings = { ..._settings, ...JSON.parse(overlaySettings) };
	}

	function updateSetting(key: keyof Settings, value: Settings[typeof key]) {
		_settings[key] = value;
		localStorage.setItem('astro:dev-overlay:settings', JSON.stringify(_settings));
	}

	function log(message: string) {
		// eslint-disable-next-line no-console
		console.log(
			`%cAstro`,
			'background: linear-gradient(66.77deg, #D83333 0%, #F041FF 100%); color: white; padding-inline: 4px; border-radius: 2px; font-family: monospace;',
			message
		);
	}

	return {
		get config() {
			return _settings;
		},
		updateSetting,
		log,
	};
}
