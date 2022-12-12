import { getEntry } from 'astro:content';

export async function get() {
	const columbia = await getEntry('blog', 'columbia.md');
	return {
		body: JSON.stringify(columbia),
	}
}
