export const prerender = false;

export function POST() {
	return Response.json({ rpc: true });
}
