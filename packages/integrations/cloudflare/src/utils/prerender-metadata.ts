import type { PrerenderMetadataResponse } from '../prerender-types.js';
import { PRERENDER_METADATA_ENDPOINT } from './prerender-constants.js';

const metadataById = new Map<string, PrerenderMetadataResponse>();

export function storePrerenderMetadata(id: string, record: PrerenderMetadataResponse): void {
	metadataById.set(id, record);
}

export function isPrerenderMetadataRequest(request: Request): boolean {
	const { pathname } = new URL(request.url);
	return pathname === PRERENDER_METADATA_ENDPOINT && request.method === 'GET';
}

export function handlePrerenderMetadataRequest(request: Request): Response {
	const id = new URL(request.url).searchParams.get('id');
	if (!id) {
		return new Response('Missing prerender metadata ID.', { status: 400 });
	}

	const record = metadataById.get(id);
	if (!record) {
		return new Response('Prerender metadata not found.', { status: 404 });
	}

	metadataById.delete(id);
	return new Response(JSON.stringify(record), {
		headers: {
			'Cache-Control': 'no-store',
			'Content-Type': 'application/json',
		},
	});
}
