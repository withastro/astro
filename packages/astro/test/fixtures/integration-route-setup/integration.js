export default function () {
	const routes = (globalThis.TEST_ROUTES_OBJECTS = []);

	return {
		name: '@astrojs/test-integration',
		hooks: {
			'astro:route:setup': ({ route }) => {
				routes.push(route);
			},
		},
	};
}
