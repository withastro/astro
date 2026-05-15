const contexts = /* @__PURE__ */ new WeakMap();
function getContext(result) {
	if (contexts.has(result)) {
		return contexts.get(result);
	}
	let ctx = {
		c: 0,
		get id() {
			return 's' + this.c.toString();
		},
	};
	contexts.set(result, ctx);
	return ctx;
}
function incrementId(ctx) {
	let id = ctx.id;
	ctx.c++;
	return id;
}
export { getContext, incrementId };
