/// <reference types="../../types/content.d.ts" />
import type { Loader } from 'astro:content';

export function file(fileName: string | URL): Loader {
	return {
		name: 'post-loader',
		load: async ({ store, logger }) => {
			logger.info('Loading posts');
		},
	};
}
