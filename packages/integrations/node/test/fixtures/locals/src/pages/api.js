
export async function post({ locals }) {
	let out = { ...locals };

	return new Response(JSON.stringify(out), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
