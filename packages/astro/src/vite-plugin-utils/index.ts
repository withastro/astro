import { name as isValidIdentifierName } from 'estree-util-is-identifier-name';
import { Data } from 'vfile';
import type { AstroConfig } from '../@types/astro';
import { appendForwardSlash } from '../core/path.js';

export function getFileInfo(id: string, config: AstroConfig) {
	const sitePathname = appendForwardSlash(
		config.site ? new URL(config.base, config.site).pathname : config.base
	);

	const fileId = id.split('?')[0];
	let fileUrl = fileId.includes('/pages/')
		? fileId.replace(/^.*?\/pages\//, sitePathname).replace(/(\/index)?\.(md|astro)$/, '')
		: undefined;
	if (fileUrl && config.trailingSlash === 'always') {
		fileUrl = appendForwardSlash(fileUrl);
	}
	return { fileId, fileUrl };
}

function isValidJsonObject(obj: unknown): obj is object {
	try {
		// ensure object is JSON-serializable
		JSON.stringify(obj);
		return typeof obj === 'object' && obj !== null;
	} catch {
		return false;
	}
}

export function safelyGetAstroExports(vfileData: Data): object {
	const { astroExports } = vfileData;

	if (!astroExports) return {};
	if (!isValidJsonObject(astroExports)) {
		throw Error(
			`[Markdown] A remark or rehype plugin tried to append invalid file exports. Ensure "astroExports" is a JSON object!`
		);
	}
	for (const key of Object.keys(astroExports)) {
		if (!isValidIdentifierName(key)) {
			throw Error(
				`[Markdown] A remark or rehype plugin provided an invalid export key: ${JSON.stringify(
					key
				)}.`
			);
		}
	}
	return astroExports;
}
