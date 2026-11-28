import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ websocket, locals }) => {
	if (!websocket?.isUpgradeRequest()) {
		return new Response('Expected a WebSocket upgrade', { status: 426 });
	}
	const { socket, response } = websocket.upgrade();
	socket.binaryType = 'arraybuffer';
	socket.addEventListener('message', (event) => {
		if (event.data === 'whoami') socket.send(locals.user ?? 'anonymous');
		else socket.send(event.data);
	});
	return response;
};
