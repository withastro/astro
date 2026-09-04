import type { APIRoute } from 'astro';
import image from '../assets/zero.svg';

export const GET: APIRoute = async () => Response.json({ image });
