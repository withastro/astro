export type HostRouteDefinition = {
	dynamic: boolean;
	input: string;
	/**
	 * An optional target
	 */
	target?: string;
	weight?: number;
	status: number;
	force?: boolean;
};
export declare class HostRoutes {
	definitions: HostRouteDefinition[];
	minInputLength: number;
	minTargetLength: number;
	/**
	 * Adds a new definition by inserting it into the list of definitions
	 * prioritized by the given weight. This keeps higher priority definitions
	 * At the top of the list once printed.
	 */
	add(definition: HostRouteDefinition): void;
	/**
	 * Removes all the saved route definitions
	 */
	empty(): boolean;
}
