import type { PropNameToSignalMap, RendererContext, SignalLike } from './types.js';
export type Context = {
	id: string;
	c: number;
	islandCount: number;
	signals: Map<SignalLike, string>;
	propsToSignals: Map<Record<string, any>, PropNameToSignalMap>;
};
export declare function getContext(result: RendererContext['result']): Context;
export declare function incrementId(ctx: Context): string;
export declare function incrementIslandId(ctx: Context): number;
