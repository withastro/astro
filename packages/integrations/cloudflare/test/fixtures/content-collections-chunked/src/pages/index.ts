import { getEntry } from 'astro:content';

export const prerender = false;

export async function GET() {
	const entry = await getEntry('generated', 'entry');
	if (entry?.data.payload.length !== 3 * 1024 * 1024) {
		return new Response('Invalid collection entry', { status: 500 });
	}

	return new Response('ok');
}
