import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
	return Response.json({ message: 'GET request processed', })
};

export const POST: APIRoute = async () => {
	return Response.json({ message: 'POST request processed', })
};
