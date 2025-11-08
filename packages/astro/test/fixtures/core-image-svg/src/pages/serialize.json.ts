import type { EndpointHandler } from 'astro';
import image from '../assets/astro.svg';

export const GET: EndpointHandler = async ({ session, request }) =>
	Response.json({
		image,
	});
