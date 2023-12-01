export async function GET({}) {
	return Response.json(
		JSON.stringify({
			name: 'Astro',
			url: 'https://astro.build/',
		})
	);
}
