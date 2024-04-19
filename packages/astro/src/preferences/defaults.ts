export const DEFAULT_PREFERENCES = {
	devToolbar: {
		/** Specifies whether the user has the Dev Overlay enabled */
		enabled: true,
	},
	checkUpdates: {
		/** Specifies whether the user has the update check enabled */
		enabled: true,
		/** Time since last check */
		_lastCheck: 0,
	},
};

export type Preferences = typeof DEFAULT_PREFERENCES;
