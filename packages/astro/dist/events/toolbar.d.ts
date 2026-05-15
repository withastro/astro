interface AppToggledEventPayload {
	app: string;
}
export declare function eventAppToggled(options: { appName: 'other' | (string & {}) }): {
	eventName: string;
	payload: AppToggledEventPayload;
}[];
export {};
