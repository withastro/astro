import fsMod from 'node:fs';
import path from 'node:path';
import type { ImageMetadata, OmitBrand } from '../assets/types.js';
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

/**
 * What `image()` returns while a collection entry is being parsed.
 *
 * `src` is prefixed so Astro can resolve the image after validation and before storing the
 * entry. Image metadata is not available to schema validation.
 */
export type ContentImageField = {
	[IMAGE_FIELD_MARKER]: true;
} & OmitBrand<ImageMetadata>;

function throwImageNotFound(src: string): never {
	throw new AstroError({
		...AstroErrorData.ImageNotFound,
		message: AstroErrorData.ImageNotFound.message(src),
	});
}

function createImageMarker(src: string): ContentImageField {
	const marker = {
		[IMAGE_FIELD_MARKER]: true,
		src: `${IMAGE_IMPORT_PREFIX}${src}`,
	} as ContentImageField;
	Object.defineProperty(marker, 'fsPath', { value: '' });
	return marker;
}

/**
 * Reads dimensions/format straight from the file. Deliberately uses the low-level prober
 * rather than `emitImageMetadata`, whose no-`fileEmitter` branch would build a dev-only
 * `/@fs/...` URL that must never reach the data store.
 */
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
export function image(rawSrc: string): ContentImageField {
	if (typeof rawSrc !== 'string') {
		throwImageNotFound(String(rawSrc));
	}
	return createImageMarker(rawSrc);
}

export async function resolveImageField(
	field: ContentImageField,
	filePath: string | undefined,
	resolveSource?: ImageSourceResolver,
): Promise<ContentImageField> {
	const rawSrc = field.src.replace(IMAGE_IMPORT_PREFIX, '');
	// Remote sources have no file to read, and an entry whose loader gave no absolute path
	// gives us nothing to resolve against.
	if (rawSrc.includes('://') || typeof filePath !== 'string' || !path.isAbsolute(filePath)) {
		return field;
	}

	// `./` and `../` are unambiguously file paths, never Vite aliases.
	const isRelative = rawSrc.startsWith('./') || rawSrc.startsWith('../');
	const isRootAbsolute = rawSrc.startsWith('/');

	// Fast path: a sibling file, found without going through Vite. A bare filename that
	// hits here is normalized to `./name` so it resolves the same way as in markdown
	// frontmatter — read time hands the stored src to Vite, which would otherwise treat a
	// bare specifier as a package.
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
				src: `${IMAGE_IMPORT_PREFIX}${isRelative ? rawSrc : `./${rawSrc}`}`,
			};
		}
		if (isRelative) {
			// Nothing else is going to resolve `./missing.png`.
			throwImageNotFound(rawSrc);
		}
	}

	// Aliases, root-absolute paths, and bare specifiers with no sibling file: only Vite
	// knows how to resolve these. Without a resolver — a loader running outside a sync, for
	// instance — defer to read time as before rather than reporting a false negative.
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

	// The source is stored unchanged: Vite resolves it again at read time, from the entry
	// file, so an alias must stay an alias.
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
