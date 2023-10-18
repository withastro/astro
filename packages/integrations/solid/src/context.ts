import type { RendererContext } from './types.js';

type Context = {
	id: string;
	c: number;
};

const contexts = new WeakMap<RendererContext['result'], Context>();

export function getContext(result: RendererContext['result']): Context {
	if (contexts.has(result)) {
		return contexts.get(result)!;
	}
	let ctx: Context = {
		c: 0,
		get id() {
			// a hyphen at the end makes it easier to distinguish the island
			// render id from component tree portion of the hydration key `data-hk="..."`
			// https://github.com/solidjs/solid-start/blob/f0860887030e0632949b3f497e279aecb6ed5afd/packages/start/islands/mount.tsx#L41
			return 's' + this.c.toString() + '-';
		},
	};
	contexts.set(result, ctx);
	return ctx;
}

export function incrementId(ctx: Context): string {
	let id = ctx.id;
	ctx.c++;
	return id;
}
