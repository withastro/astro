import fsMod from 'node:fs';
import path from 'node:path';
import type { ImageMetadata, OmitBrand } from '../assets/types.js';
import { imageMetadata } from '../assets/utils/metadata.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { IMAGE_FIELD_MARKER, IMAGE_IMPORT_PREFIX } from './consts.js';
import { getContentImageResolver } from './image-context.js';

/**
 * Config-time image helper, published as `astro/content/image`.
 *
 * This is a Node-only entrypoint, like `astro/loaders`: it is imported by
 * `content.config.ts`, never by a page, so it is free to touch the filesystem. Keeping it
 * out of `astro:content` is what lets that module stay free of Node builtins and run on
 * Cloudflare and Deno, which the `verify-no-node-stuff` test plugin enforces.
 */

/**
 * What `image()` returns while a collection entry is being parsed.
 *
 * `width`/`height`/`format` are read from the file, so schemas can validate them. `src` is
 * deliberately *not* final: it is a `/@fs/...` URL in dev and a hashed emitted asset in a
 * build, and only Vite knows which. It stays a marker until read time, where the real
 * `ImageMetadata` is merged over this object — so fields added by transforms downstream of
 * `image()` survive.
 *
 * The dimensions are absent when the source cannot be located from `context.filePath`: a
 * remote URL, a Vite alias, or a root-absolute path. Those are resolved by Vite at read
 * time instead.
 */
export type ContentImageField = {
	[IMAGE_FIELD_MARKER]: true;
	src: string;
} & Partial<Omit<OmitBrand<ImageMetadata>, 'src' | 'fsPath'>>;

/** The part of the schema context `image()` needs. */
export type ImageContext = { filePath?: string };

function throwImageNotFound(src: string): never {
	throw new AstroError({
		...AstroErrorData.ImageNotFound,
		message: AstroErrorData.ImageNotFound.message(src),
	});
}

function createImageMarker(src: string): ContentImageField {
	return { [IMAGE_FIELD_MARKER]: true, src: `${IMAGE_IMPORT_PREFIX}${src}` };
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
 * Resolves an image source against the entry currently being parsed.
 *
 * Call it from inside a schema transform, so it composes with any validator and its result
 * can be validated further:
 *
 * ```js
 * schema: (context) => z.object({
 *   cover: z.string()
 *     .transform((src) => image(context, { src }))
 *     .refine((cover) => cover.width >= 1000, 'cover must be at least 1000px wide'),
 * })
 * ```
 */
export async function image(
	context: ImageContext,
	options: { src: string },
): Promise<ContentImageField> {
	const rawSrc = options?.src;
	if (typeof rawSrc !== 'string') {
		throwImageNotFound(String(rawSrc));
	}

	if (typeof context !== 'object' || context === null) {
		throw new AstroError({
			...AstroErrorData.ImageNotFound,
			title: 'Invalid `image()` usage.',
			message:
				'`image()` must be called with the schema context: `schema: (context) => z.object({ cover: z.string().transform((src) => image(context, { src })) })`.',
			hint: 'Check that the first argument is the context passed to your `schema` function.',
		});
	}

	const entryFilePath = context.filePath;
	// Remote sources have no file to read, and an entry whose loader gave no absolute path
	// gives us nothing to resolve against.
	if (
		rawSrc.includes('://') ||
		typeof entryFilePath !== 'string' ||
		!path.isAbsolute(entryFilePath)
	) {
		return createImageMarker(rawSrc);
	}

	// `./` and `../` are unambiguously file paths, never Vite aliases.
	const isRelative = rawSrc.startsWith('./') || rawSrc.startsWith('../');
	const isRootAbsolute = rawSrc.startsWith('/');

	// Fast path: a sibling file, found without going through Vite. A bare filename that
	// hits here is normalized to `./name` so it resolves the same way as in markdown
	// frontmatter — read time hands the stored src to Vite, which would otherwise treat a
	// bare specifier as a package.
	if (!isRootAbsolute) {
		const candidate = path.resolve(path.dirname(entryFilePath), rawSrc);
		if (fsMod.existsSync(candidate)) {
			const metadata = await probe(candidate);
			if (!metadata) {
				throwImageNotFound(rawSrc);
			}
			return { ...createImageMarker(isRelative ? rawSrc : `./${rawSrc}`), ...metadata };
		}
		if (isRelative) {
			// Nothing else is going to resolve `./missing.png`.
			throwImageNotFound(rawSrc);
		}
	}

	// Aliases, root-absolute paths, and bare specifiers with no sibling file: only Vite
	// knows how to resolve these. Without a resolver — a loader running outside a sync, for
	// instance — defer to read time as before rather than reporting a false negative.
	const resolveSource = getContentImageResolver(context);
	if (!resolveSource) {
		return createImageMarker(rawSrc);
	}

	const resolvedPath = await resolveSource(rawSrc, entryFilePath);
	if (!resolvedPath) {
		throwImageNotFound(rawSrc);
	}

	const metadata = await probe(resolvedPath);
	if (!metadata) {
		throwImageNotFound(rawSrc);
	}

	// The source is stored unchanged: Vite resolves it again at read time, from the entry
	// file, so an alias must stay an alias.
	return { ...createImageMarker(rawSrc), ...metadata };
}
