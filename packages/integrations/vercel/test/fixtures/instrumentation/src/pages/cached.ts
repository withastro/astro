import type { APIRoute } from 'astro';
import { contextResponse } from '../context-response';

export const prerender = false;

export const GET: APIRoute = contextResponse;
