
export default function() {
	return {
		name: 'renderer-one',
		hooks: {
			'astro:config:setup': ({ addRenderer }) => {
				addRenderer({
					name: 'renderer-one',
					clientEntrypoint: null,
					serverEntrypoint: '@astrojs/renderer-one/server.mjs',
				});
			}
		}
	};
}
