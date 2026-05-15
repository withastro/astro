type SupportedReactVersion = keyof typeof versionsConfig;
export type ReactVersionConfig = (typeof versionsConfig)[SupportedReactVersion];
export declare function getReactMajorVersion(): number;
export declare function isSupportedReactVersion(
	majorVersion: number,
): majorVersion is SupportedReactVersion;
export declare const versionsConfig: {
	17: {
		server: string;
		client: string;
	};
	18: {
		server: string;
		client: string;
	};
	19: {
		server: string;
		client: string;
	};
};
export {};
