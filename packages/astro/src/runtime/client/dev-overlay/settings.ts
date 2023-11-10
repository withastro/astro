export interface Settings {
	showPluginNotifications: boolean;
	verbose: boolean;
}

export const defaultSettings = {
	showPluginNotifications: true,
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

	return {
		get config() {
			return _settings;
		},
		updateSetting,
	};
}
