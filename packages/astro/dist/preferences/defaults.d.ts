export declare const DEFAULT_PREFERENCES: {
	devToolbar: {
		/** Specifies whether the user has the Dev Overlay enabled */
		enabled: boolean;
	};
	checkUpdates: {
		/** Specifies whether the user has the update check enabled */
		enabled: boolean;
	};
	_variables: {
		/** Time since last update check */
		lastUpdateCheck: number;
	};
};
export type Preferences = typeof DEFAULT_PREFERENCES;
export type PublicPreferences = Omit<Preferences, '_variables'>;
