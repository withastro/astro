export default function customElementRenderer() {
	return {
		name: 'custom-element-test-renderer',
		hooks: {
			'astro:config:setup': ({ addRenderer }) => {
				addRenderer({
					name: 'custom-element-test-renderer',
					serverEntrypoint: new URL('./server.mjs', import.meta.url),
				});
			},
		},
	};
}
