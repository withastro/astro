export const prerender = false;

export const GET = async (context) => {
	// Set only tags, no maxAge
	context.cache.set({ tags: ['product', 'sku-123'] });
	return Response.json({ tagged: true });
};
