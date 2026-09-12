import { notFound } from 'astro:navigation';
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
	return notFound('API item not found', 'API Error');
};
