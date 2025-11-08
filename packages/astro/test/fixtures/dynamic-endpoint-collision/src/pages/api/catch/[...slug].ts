import type { EndpointHandler } from 'astro';

const slugs = ['one', undefined];

export const GET: EndpointHandler = ({ params }) => {
	return Response.json({
		slug: params.slug || 'index',
	});
};

export function getStaticPaths() {
	return slugs.map((u) => ({ params: { slug: u } }));
}
