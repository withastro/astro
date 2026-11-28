import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ websocket }) => {
	const { socket, response } = websocket!.upgrade();
	socket.addEventListener('message', (event) => {
		const message = JSON.parse(event.data);
		socket.send(`got ${message.text}`);
	});
	return response;
};
