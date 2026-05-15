/**
 * Timer to track certain operations' performance. Used by Astro's scripts only.
 * Set `process.env.ASTRO_TIMER_PATH` truthy to enable.
 */
export declare class AstroTimer {
	private enabled;
	private ongoingTimers;
	private stats;
	constructor();
	/**
	 * Start a timer for a scope with a given name.
	 */
	start(name: string): void;
	/**
	 * End a timer for a scope with a given name.
	 */
	end(name: string): void;
	/**
	 * Write stats to `process.env.ASTRO_TIMER_PATH`
	 */
	writeStats(): void;
}
