import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ websocket, locals }) => {
	if (!locals.user) return new Response('Unauthorized', { status: 401 });
	const { socket, response } = websocket!.upgrade();
	socket.addEventListener('open', () => socket.send(`hello ${locals.user}`));
	return response;
};
