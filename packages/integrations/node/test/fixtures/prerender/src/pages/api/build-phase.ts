import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ buildPhase }) => {
	return new Response(JSON.stringify({ buildPhase }), {
		headers: { 'Content-Type': 'application/json' },
	});
};
