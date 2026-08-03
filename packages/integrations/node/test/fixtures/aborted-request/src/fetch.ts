export default {
	async fetch(request: Request) {
		const { pathname } = new URL(request.url);
		if (pathname === '/rejection') {
			return new Response(
				new ReadableStream(
					{
						pull(controller) {
							Reflect.set(
								globalThis,
								'__astroTestRejection',
								Promise.reject(new Error('intentional rejection')),
							);
							controller.enqueue(new TextEncoder().encode('ok'));
							controller.close();
						},
					},
					{ highWaterMark: 0 },
				),
			);
		}
		if (request.method === 'POST') await request.json();
		return new Response('ok');
	},
};
