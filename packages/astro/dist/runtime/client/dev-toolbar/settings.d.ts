import { type Placement } from './ui-library/window.js';
export interface Settings {
	disableAppNotification: boolean;
	verbose: boolean;
	placement: Placement;
}
export declare const defaultSettings: {
	disableAppNotification: false;
	verbose: false;
	placement: 'bottom-center';
};
export declare const settings: {
	readonly config: Settings;
	updateSetting: <Key extends keyof Settings>(key: Key, value: Settings[Key]) => void;
	logger: {
		log: (message: string, level?: 'log' | 'warn' | 'error') => void;
		warn: (message: string) => void;
		error: (message: string) => void;
		verboseLog: (message: string) => void;
	};
};
