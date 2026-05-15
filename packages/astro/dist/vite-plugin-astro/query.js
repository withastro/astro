function parseAstroRequest(id) {
	const [filename, rawQuery] = id.split(`?`, 2);
	const query = Object.fromEntries(new URLSearchParams(rawQuery).entries());
	if (query.astro != null) {
		query.astro = true;
	}
	if (query.src != null) {
		query.src = true;
	}
	if (query.index != null) {
		query.index = Number(query.index);
	}
	if (query.raw != null) {
		query.raw = true;
	}
	if (query.inline != null) {
		query.inline = true;
	}
	return {
		filename,
		query,
	};
}
export { parseAstroRequest };
