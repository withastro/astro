import fsMod from 'node:fs';
import path from 'node:path';
import type { ImageMetadata } from '../assets/types.js';
import { imageMetadata } from '../assets/utils/metadata.js';
import { AstroError, AstroErrorData } from '@astrojs/runtime/_internal/core/errors/index.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { IMAGE_FIELD_MARKER, IMAGE_IMPORT_PREFIX } from './consts.js';
export type ImageSourceResolver = (source: string, importer: string) => Promise<string | undefined>;

/**
 * Config-time image helper, published as `astro/content/fields`.
 *
 * This is a Node-only entrypoint, like `astro/loaders`: it is imported by
 * `content.config.ts`, never by a page, so it is free to touch the filesystem. Keeping it
 * out of `astro:content` is what lets that module stay free of Node builtins and run on
 * Cloudflare and Deno, which the `verify-no-node-stuff` test plugin enforces.
 */

function throwImageNotFound(src: string): never {
	throw new AstroError({
		...AstroErrorData.ImageNotFound,
		message: AstroErrorData.ImageNotFound.message(src),
	});
}

// Without a file emitter, `emitImageMetadata` would put a dev-only `/@fs/` URL in the data store.
async function probe(fsPath: string) {
	let fileData: Buffer;
	try {
		fileData = await fsMod.promises.readFile(fsPath);
	} catch {
		return undefined;
	}
	const metadata = await imageMetadata(fileData, fsPath);
	if (path.extname(fsPath).toLowerCase() === '.apng') {
		metadata.format = 'apng';
	}
	return metadata;
}

/**
 * Marks an image path in a build-time collection. Call `image(src)` in a schema
 * transform and return its result as the field value. Astro resolves local image
 * metadata after validation, so schema refinements cannot check dimensions or format.
 */
export function image(rawSrc: string): ImageMetadata {
	if (typeof rawSrc !== 'string') {
		throwImageNotFound(String(rawSrc));
	}
	const marker = { [IMAGE_FIELD_MARKER]: true, src: `${IMAGE_IMPORT_PREFIX}${rawSrc}` };
	Object.defineProperty(marker, 'fsPath', { value: '' });
	return marker as unknown as ImageMetadata;
}

export async function resolveImageField(
	field: ImageMetadata,
	filePath: string | undefined,
	resolveSource?: ImageSourceResolver,
): Promise<ImageMetadata> {
	const rawSrc = field.src.replace(IMAGE_IMPORT_PREFIX, '');
	if (rawSrc.includes('://') || typeof filePath !== 'string' || !path.isAbsolute(filePath)) {
		return field;
	}

	const isRelative = rawSrc.startsWith('./') || rawSrc.startsWith('../');
	const isRootAbsolute = rawSrc.startsWith('/');

	if (!isRootAbsolute) {
		const candidate = path.resolve(path.dirname(filePath), rawSrc);
		if (fsMod.existsSync(candidate)) {
			const metadata = await probe(candidate);
			if (!metadata) {
				throwImageNotFound(rawSrc);
			}
			return {
				...field,
				...metadata,
				// Vite treats a bare filename as a package name when it reads the stored path.
				src: `${IMAGE_IMPORT_PREFIX}${isRelative ? rawSrc : `./${rawSrc}`}`,
			};
		}
		if (isRelative) {
			throwImageNotFound(rawSrc);
		}
	}

	if (!resolveSource) {
		return field;
	}

	const resolvedPath = await resolveSource(rawSrc, filePath);
	if (!resolvedPath) {
		throwImageNotFound(rawSrc);
	}

	const metadata = await probe(resolvedPath);
	if (!metadata) {
		throwImageNotFound(rawSrc);
	}

	// Keep the alias so Vite can resolve it relative to the entry at read time.
	return { ...field, ...metadata, src: field.src };
}

export function createViteImageSourceResolver(
	server: import('vite').ViteDevServer,
): ImageSourceResolver {
	return async (source, importer) => {
		const resolved = await server.environments[
			ASTRO_VITE_ENVIRONMENT_NAMES.ssr
		].pluginContainer.resolveId(source, importer);
		if (!resolved) {
			return undefined;
		}
		const id = resolved.id.split('?')[0].split('#')[0];
		return path.isAbsolute(id) && fsMod.existsSync(id) ? id : undefined;
	};
}
