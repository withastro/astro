/** Adds a header carrying the feature's manifest data to every response. */
export default async function featureHandler(state, next) {
	const response = await next(state);
	const data = await state.manifest.featureData();
	response.headers.set('x-feature-data', data.default);
	return response;
}
