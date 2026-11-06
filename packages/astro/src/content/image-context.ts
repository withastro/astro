import fsMod from 'node:fs';
import path from 'node:path';
import type { ViteDevServer } from 'vite';

export type ImageSourceResolver = (source: string, importer: string) => Promise<string | undefined>;

const contentImageResolverKey = '__astro_content_image_resolver__';

export function attachContentImageResolver<T extends object>(
	context: T,
	resolver: ImageSourceResolver | undefined,
): T {
	if (resolver) {
		Object.defineProperty(context, contentImageResolverKey, { value: resolver });
	}
	return context;
}

export function getContentImageResolver(context: object): ImageSourceResolver | undefined {
	return (context as Record<string, ImageSourceResolver | undefined>)[contentImageResolverKey];
}

export function createViteImageSourceResolver(server: ViteDevServer): ImageSourceResolver {
	return async (source, importer) => {
		const resolved = await server.environments.ssr.pluginContainer.resolveId(source, importer);
		if (!resolved) {
			return undefined;
		}
		const id = resolved.id.split('?')[0].split('#')[0];
		return path.isAbsolute(id) && fsMod.existsSync(id) ? id : undefined;
	};
}
