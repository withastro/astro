import { astro, FetchState } from 'astro/fetch';

export default {
	async fetch(request: Request): Promise<Response> {
		return astro(new FetchState(request));
	},
};
