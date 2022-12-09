import type fsMod from 'node:fs';
import matter from 'gray-matter';
import { z } from 'zod';
import { createServer, ErrorPayload as ViteErrorPayload, ViteDevServer } from 'vite';
import { astroContentVirtualModPlugin, getPaths } from './vite-plugin-content.js';
import { AstroSettings } from '../@types/astro.js';

export const collectionConfigParser = z.object({
	schema: z.any().optional(),
	slug: z
		.function()
		.args(
			z.object({
				id: z.string(),
				collection: z.string(),
				defaultSlug: z.string(),
				body: z.string(),
				data: z.record(z.any()),
			})
		)
		.returns(z.union([z.string(), z.promise(z.string())]))
		.optional(),
});

export const contentConfigParser = z.object({
	collections: z.record(collectionConfigParser),
});

export type CollectionConfig = z.infer<typeof collectionConfigParser>;
export type ContentConfig = z.infer<typeof contentConfigParser>;

type Entry = {
	id: string;
	collection: string;
	slug: string;
	data: any;
	body: string;
	_internal: { rawData: string; filePath: string };
};

export const msg = {
	collectionConfigMissing: (collection: string) =>
		`${collection} does not have a config. We suggest adding one for type safety!`,
};

export async function getEntrySlug(entry: Entry, collectionConfig: CollectionConfig) {
	return (
		collectionConfig.slug?.({
			id: entry.id,
			data: entry.data,
			defaultSlug: entry.slug,
			collection: entry.collection,
			body: entry.body,
		}) ?? entry.slug
	);
}

export async function getEntryData(entry: Entry, collectionConfig: CollectionConfig) {
	let data = entry.data;
	if (collectionConfig.schema) {
		// Use `safeParseAsync` to allow async transforms
		const parsed = await z.object(collectionConfig.schema).safeParseAsync(entry.data, { errorMap });
		if (parsed.success) {
			data = parsed.data;
		} else {
			const formattedError = new Error(
				[
					`Could not parse frontmatter in ${String(entry.collection)} → ${String(entry.id)}`,
					...parsed.error.errors.map((zodError) => zodError.message),
				].join('\n')
			);
			(formattedError as any).loc = {
				file: entry._internal.filePath,
				line: getFrontmatterErrorLine(
					entry._internal.rawData,
					String(parsed.error.errors[0].path[0])
				),
				column: 1,
			};
			throw formattedError;
		}
	}
	return data;
}

const flattenPath = (path: (string | number)[]) => path.join('.');

const errorMap: z.ZodErrorMap = (error, ctx) => {
	if (error.code === 'invalid_type') {
		const badKeyPath = JSON.stringify(flattenPath(error.path));
		if (error.received === 'undefined') {
			return { message: `${badKeyPath} is required.` };
		} else {
			return { message: `${badKeyPath} should be ${error.expected}, not ${error.received}.` };
		}
	}
	return { message: ctx.defaultError };
};

// WARNING: MAXIMUM JANK AHEAD
function getFrontmatterErrorLine(rawFrontmatter: string, frontmatterKey: string) {
	const indexOfFrontmatterKey = rawFrontmatter.indexOf(`\n${frontmatterKey}`);
	if (indexOfFrontmatterKey === -1) return 0;

	const frontmatterBeforeKey = rawFrontmatter.substring(0, indexOfFrontmatterKey + 1);
	const numNewlinesBeforeKey = frontmatterBeforeKey.split('\n').length;
	return numNewlinesBeforeKey;
}

/**
 * Match YAML exception handling from Astro core errors
 * @see 'astro/src/core/errors.ts'
 */
export function parseFrontmatter(fileContents: string, filePath: string) {
	try {
		return matter(fileContents);
	} catch (e: any) {
		if (e.name === 'YAMLException') {
			const err: Error & ViteErrorPayload['err'] = e;
			err.id = filePath;
			err.loc = { file: e.id, line: e.mark.line + 1, column: e.mark.column };
			err.message = e.reason;
			throw err;
		} else {
			throw e;
		}
	}
}

export class NotFoundError extends TypeError {}
export class ZodParseError extends TypeError {}

export async function loadContentConfig({
	fs,
	settings,
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
}): Promise<ContentConfig | Error> {
	const paths = getPaths({ srcDir: settings.config.srcDir });
	const tempConfigServer: ViteDevServer = await createServer({
		root: settings.config.root.pathname,
		server: { middlewareMode: true, hmr: false },
		optimizeDeps: { entries: [] },
		clearScreen: false,
		appType: 'custom',
		logLevel: 'silent',
		plugins: [astroContentVirtualModPlugin({ settings })],
	});
	let unparsedConfig;
	try {
		unparsedConfig = await tempConfigServer.ssrLoadModule(paths.config.pathname);
	} catch {
		return new NotFoundError('Failed to resolve content config.');
	} finally {
		await tempConfigServer.close();
	}
	const config = contentConfigParser.safeParse(unparsedConfig);
	if (config.success) {
		return config.data;
	} else {
		return new ZodParseError('Content config file is invalid.');
	}
}
