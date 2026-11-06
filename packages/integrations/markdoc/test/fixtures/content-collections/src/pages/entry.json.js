import { getEntry } from 'astro:content';
import { stringify } from 'devalue';

export async function GET() {
	const post = await getEntry('blog', 'post-1');
	return new Response(stringify(post));
}
