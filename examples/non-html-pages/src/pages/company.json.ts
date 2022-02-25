export async function get() {
	return {
		body: JSON.stringify({
			name: 'Astro',
			url: 'https://astro.build/',
		}),
	};
}
