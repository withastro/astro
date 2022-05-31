(globalThis as any).process = {
	argv: [],
	// @ts-ignore
	env: Deno.env.toObject(),
};
