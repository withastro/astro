function getOrigQueryParams(params) {
	const width = params.get('origWidth');
	const height = params.get('origHeight');
	const format = params.get('origFormat');
	if (!width || !height || !format) {
		return void 0;
	}
	return {
		width: Number.parseInt(width),
		height: Number.parseInt(height),
		format,
	};
}
export { getOrigQueryParams };
