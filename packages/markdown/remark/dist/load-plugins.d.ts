import type * as unified from 'unified';
export declare function loadPlugins(
	items: (
		| string
		| [string, any]
		| unified.Plugin<any[], any>
		| [unified.Plugin<any[], any>, any]
	)[],
): Promise<[unified.Plugin, any?]>[];
