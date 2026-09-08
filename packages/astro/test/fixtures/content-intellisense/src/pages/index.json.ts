import { getCollection } from 'astro:content';

// Generates a JSON file containing content collection data for testing.
export const GET = async () => {
	return new Response(JSON.stringify({
		'data-cl': await getCollection('data-cl'),
		'data-cl-json': await getCollection('data-cl-json'),
		'data-schema-misuse': await getCollection('data-schema-misuse'),
	}));
};
