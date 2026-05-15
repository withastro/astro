export type AstroTelemetryOptions = {
	astroVersion: string;
	viteVersion: string;
};
export type TelemetryEvent = {
	eventName: string;
	payload: Record<string, any>;
};
export declare class AstroTelemetry {
	private opts;
	private _anonymousSessionId;
	private _anonymousProjectInfo;
	private config;
	private isCI;
	private env;
	private get astroVersion();
	private get viteVersion();
	private get ASTRO_TELEMETRY_DISABLED();
	private get TELEMETRY_DISABLED();
	constructor(opts: AstroTelemetryOptions);
	/**
	 * Get value from either the global config or the provided fallback.
	 * If value is not set, the fallback is saved to the global config,
	 * persisted for later sessions.
	 */
	private getConfigWithFallback;
	private get enabled();
	private get notifyDate();
	private get anonymousId();
	private get anonymousSessionId();
	private get anonymousProjectInfo();
	private get isDisabled();
	setEnabled(value: boolean): void;
	clear(): void;
	isValidNotice(): boolean;
	notify(callback: () => boolean | Promise<boolean>): Promise<void>;
	record(event?: TelemetryEvent | TelemetryEvent[]): Promise<any>;
}
