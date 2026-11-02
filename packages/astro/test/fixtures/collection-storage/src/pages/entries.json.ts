import type { APIRoute } from 'astro';
import { getCollection, getEntries, getEntry, render } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async () => {
	const docs = await getCollection({ name: 'docs', content: false });
	const full = await getCollection('docs');
	const filtered = await getCollection({ name: 'docs', filter: (doc) => doc.id === 'setup' });
	const intro = await getEntry('docs', 'intro', { content: false });
	const byReference = await getEntries([{ collection: 'docs', id: 'setup' }], { content: false });
	let renderError: string | undefined;
	try {
		await render(intro!);
	} catch (error) {
		renderError = (error as Error).name;
	}
	return Response.json({
		ids: docs.map((doc) => doc.id).sort(),
		withoutContent: docs.every((doc) => !('body' in doc) && !('rendered' in doc)),
		withContent: full.every((doc) => typeof doc.body === 'string' && doc.rendered),
		filtered: filtered.map((doc) => ({ id: doc.id, hasBody: typeof doc.body === 'string' })),
		intro: { title: intro?.data.title, hasBody: 'body' in intro! },
		byReference: byReference.map((doc) => doc?.id),
		renderError,
		missing: (await getEntry('docs', 'missing')) ?? null,
	});
};
