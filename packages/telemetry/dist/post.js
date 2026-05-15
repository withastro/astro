const ASTRO_TELEMETRY_ENDPOINT = `https://telemetry.astro.build/api/v1/record`;
function post(body) {
	return fetch(ASTRO_TELEMETRY_ENDPOINT, {
		method: 'POST',
		body: JSON.stringify(body),
		headers: { 'content-type': 'application/json' },
	});
}
export { post };
