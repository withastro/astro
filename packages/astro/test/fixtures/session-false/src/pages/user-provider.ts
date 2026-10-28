import type { APIRoute } from 'astro';
// `.js` extension is intentional — this is the specifier shape that
// enters the `astro:session-provider` plugin's prefilter. The plugin
// must resolve the import to the user's own file (not Astro's provider)
// and leave it untouched. Imported with `.ts` instead, the prefilter
// would skip and this test would pass trivially.
import { USER_PROVIDER_SENTINEL } from '../session/provider.js';

export const GET: APIRoute = () => Response.json({ value: USER_PROVIDER_SENTINEL });
