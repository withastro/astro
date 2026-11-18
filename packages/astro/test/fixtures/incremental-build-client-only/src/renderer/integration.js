export default function customRenderer() {
	return {
		name: 'custom-renderer',
		hooks: {
			'astro:config:setup': ({ addRenderer }) => {
				addRenderer({
					name: 'custom-renderer',
					clientEntrypoint: new URL('./client.js', import.meta.url).href,
					serverEntrypoint: new URL('./server.js', import.meta.url).href,
				});
			},
		},
	};
}
