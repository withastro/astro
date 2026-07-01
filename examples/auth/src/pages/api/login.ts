import type { APIRoute } from 'astro';
import { auth } from '../../../auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
	return auth.api.login(context);
};
