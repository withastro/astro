const contexts = /* @__PURE__ */ new WeakMap();
function getContext(result) {
	if (contexts.has(result)) {
		return contexts.get(result);
	}
	let ctx = {
		c: 0,
		islandCount: 0,
		get id() {
			return 'p' + this.c.toString();
		},
		signals: /* @__PURE__ */ new Map(),
		propsToSignals: /* @__PURE__ */ new Map(),
	};
	contexts.set(result, ctx);
	return ctx;
}
function incrementId(ctx) {
	let id = ctx.id;
	ctx.c++;
	return id;
}
function incrementIslandId(ctx) {
	const islandId = ctx.islandCount;
	ctx.islandCount++;
	return islandId;
}
export { getContext, incrementId, incrementIslandId };
