function resolveMiddlewareMode(features) {
	if (features?.middlewareMode) {
		return features.middlewareMode;
	}
	if (features?.edgeMiddleware === true) {
		return 'edge';
	}
	return 'classic';
}
export { resolveMiddlewareMode };
