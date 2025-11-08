import { defineEndpoint } from 'astro:endpoint';

export const GET = defineEndpoint(() => Response.json({ ok: true, test: 'defineEndpoint' }))
