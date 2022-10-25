import { z } from 'zod';
import { prependForwardSlash } from '../core/path.js';

export async function parseEntryData(
	collection: string,
	entryKey: string,
	unparsedEntry: { data: any; rawData: string },
	{ schemaMap }: { schemaMap: Record<string, any> }
) {
	const schemaImport = (await schemaMap[collection]) ?? {};
	if (!('schema' in schemaImport)) throw getErrorMsg.schemaNamedExp(collection);
	const { schema } = schemaImport;

	try {
		return schema.parse(unparsedEntry.data, { errorMap });
	} catch (e) {
		if (e instanceof z.ZodError) {
			const formattedError = new Error(
				[
					`Could not parse frontmatter in ${String(collection)} → ${String(entryKey)}`,
					...e.errors.map((e) => e.message),
				].join('\n')
			);
			(formattedError as any).loc = {
				file: 'TODO',
				line: getFrontmatterErrorLine(unparsedEntry.rawData, String(e.errors[0].path[0])),
				column: 1,
			};
			throw formattedError;
		}
	}
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
	console.log({ rawFrontmatter, frontmatterKey });
	const indexOfFrontmatterKey = rawFrontmatter.indexOf(`\n${frontmatterKey}`);
	if (indexOfFrontmatterKey === -1) return 0;

	const frontmatterBeforeKey = rawFrontmatter.substring(0, indexOfFrontmatterKey + 1);
	const numNewlinesBeforeKey = frontmatterBeforeKey.split('\n').length;
	return numNewlinesBeforeKey;
}

export const getErrorMsg = {
	schemaMissing: (collection: string) =>
		`${collection} does not have a ~schema file. We suggest adding one for type safety!`,
	schemaNamedExp: (collection: string) =>
		new Error(`${collection}/~schema needs a named \`schema\` export.`),
};

export function createRenderContent(renderContentMap: Record<string, () => Promise<any>>) {
	return async function renderContent(this: any, entryOrEntryId: { id: string } | string) {
		const contentKey = typeof entryOrEntryId === 'object' ? entryOrEntryId.id : entryOrEntryId;
		const modImport = renderContentMap[contentKey];
		if (!modImport) throw new Error(`${JSON.stringify(contentKey)} does not exist!`);

		const mod = await modImport();

		if (import.meta.env.PROD && 'collectedCss' in mod && 'links' in (this ?? {})) {
			for (const cssAsset of mod.collectedCss) {
				this.links.add({
					props: { rel: 'stylesheet', href: prependForwardSlash(cssAsset) },
					children: '',
				});
			}
		}
		return mod;
	};
}
