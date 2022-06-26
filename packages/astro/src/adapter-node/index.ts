import { AstroAdapter } from "../@types/astro";

export function getGenericNodeAdapter(): AstroAdapter {
	return {
		name: 'node',
		serverEntrypoint: 'astro/adapter-node/server.js',
		exports: ['handler'],
	};
}
