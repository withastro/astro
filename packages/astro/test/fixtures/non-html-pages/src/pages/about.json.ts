// Returns the file body for this non-HTML file.
// The content type is based off of the extension in the filename,
// in this case: about.json.
export async function get() {
	return {
		body: JSON.stringify({
			name: 'Astro',
			url: 'https://astro.build/',
		}),
	};
}
