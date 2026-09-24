import { getEntry } from 'astro:content';

export async function GET() {
	const item = await getEntry('i18n', 'en');
	return Response.json(item);
}
