import type { APIRoute } from 'astro';
import image from '../assets/astro.svg';

export const GET: APIRoute = async ({ session, request }) =>
	Response.json({
		image,
	});
