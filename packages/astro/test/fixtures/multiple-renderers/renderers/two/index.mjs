
export default function() {
	return {
		name: 'renderer-two',
		hooks: {
			'astro:config:setup': ({ addRenderer }) => {
				addRenderer({
					name: 'renderer-two',
					clientEntrypoint: null,
					serverEntrypoint: '@astrojs/renderer-two/server.mjs',
				});
			}
		}
	};
}
