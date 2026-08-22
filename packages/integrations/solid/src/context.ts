import type { IslandAccessor } from './island-signal.js';
import type { PropNameToSignalMap, RendererContext } from './types.js';

export type Context = {
	id: string;
	c: number;
	signalId: string;
	sc: number;
	signals: Map<IslandAccessor<any>, string>;
	propsToSignals: Map<Record<string, any>, PropNameToSignalMap>;
};

const contexts = new WeakMap<RendererContext['result'], Context>();

export function getContext(result: RendererContext['result']): Context {
	if (contexts.has(result)) {
		return contexts.get(result)!;
	}
	let ctx: Context = {
		c: 0,
		get id() {
			return 's' + this.c.toString();
		},
		sc: 0,
		get signalId() {
			return 'sg' + this.sc.toString();
		},
		signals: new Map(),
		propsToSignals: new Map(),
	};
	contexts.set(result, ctx);
	return ctx;
}

export function incrementId(ctx: Context): string {
	let id = ctx.id;
	ctx.c++;
	return id;
}

export function incrementSignalId(ctx: Context): string {
	let id = ctx.signalId;
	ctx.sc++;
	return id;
}
