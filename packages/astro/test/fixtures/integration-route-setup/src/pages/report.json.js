const routes = (globalThis.TEST_ROUTES_OBJECTS ?? []);

export const GET = () => {
	// Routes are not garanteed to be loaded in any particular order
	// sort for test stability.
	routes.sort((a, b) => a.component.localeCompare(b.component));

	return new Response(JSON.stringify(routes), {
		headers: {
			'content-type': 'application/json'
		},
	});
};
