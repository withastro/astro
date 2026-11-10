export const prerender = false;

export async function POST({ request }: { request: Request }) {
	return Response.json({ echo: await request.text() });
}
