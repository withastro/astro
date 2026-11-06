export default {
	async fetch(request: Request) {
		if (request.method === 'POST') {
			console.error('reading-json-body');
			await request.json();
		}
		return new Response('ok');
	},
};