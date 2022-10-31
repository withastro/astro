import type { PluginContext } from 'rollup';
import { fileURLToPath } from 'url';
import type { TransformStyle } from '../core/compile/index';
import { createTransformStyleWithViteFn, TransformStyleWithVite } from './transform-with-vite.js';

import { readFileSync } from 'fs';
import type * as vite from 'vite';
import { AstroErrorCodes } from '../core/errors/errors-data.js';
import { CSSError } from '../core/errors/errors.js';
import { positionAt } from '../core/errors/index.js';

export type ViteStyleTransformer = {
	viteDevServer?: vite.ViteDevServer;
	transformStyleWithVite: TransformStyleWithVite;
};

export function createViteStyleTransformer(viteConfig: vite.ResolvedConfig): ViteStyleTransformer {
	return {
		transformStyleWithVite: createTransformStyleWithViteFn(viteConfig),
	};
}

function getNormalizedIDForPostCSS(filename: string): string {
	try {
		const filenameURL = new URL(`file://${filename}`);
		return fileURLToPath(filenameURL);
	} catch (err) {
		// Not a real file, so just use the provided filename as the normalized id
		return filename;
	}
}

export function createTransformStyles(
	viteStyleTransformer: ViteStyleTransformer,
	filename: string,
	ssr: boolean,
	pluginContext?: PluginContext
): TransformStyle {
	const normalizedID = getNormalizedIDForPostCSS(filename);

	return async function (styleSource, lang) {
		let result: any;
		try {
			result = await viteStyleTransformer.transformStyleWithVite.call(pluginContext, {
				id: normalizedID,
				source: styleSource,
				lang,
				ssr,
				viteDevServer: viteStyleTransformer.viteDevServer,
			});
		} catch (err: any) {
			const fileContent = readFileSync(filename).toString();
			const styleTagBeginning = fileContent.indexOf(err.input?.source ?? err.code);

			// PostCSS Syntax Error
			if (err.name === 'CssSyntaxError') {
				const errorLine = positionAt(styleTagBeginning, fileContent).line + (err.line ?? 0);

				// Vite will handle creating the frame for us with proper line numbers, no need to create one

				throw new CSSError({
					errorCode: AstroErrorCodes.CssSyntaxError,
					message: err.reason,
					location: {
						file: filename,
						line: errorLine,
						column: err.column,
					},
				});
			}

			// Some CSS processor will return a line and a column, so let's try to show a pretty error
			if (err.line && err.column) {
				const errorLine = positionAt(styleTagBeginning, fileContent).line + (err.line ?? 0);

				throw new CSSError({
					errorCode: AstroErrorCodes.CssUnknownError,
					message: err.message,
					location: {
						file: filename,
						line: errorLine,
						column: err.column,
					},
					frame: err.frame,
				});
			}

			// For other errors we'll just point to the beginning of the style tag
			const errorPosition = positionAt(styleTagBeginning, fileContent);
			errorPosition.line += 1;

			throw new CSSError({
				errorCode: AstroErrorCodes.CssUnknownError,
				message: err.message,
				location: {
					file: filename,
					line: errorPosition.line,
					column: 0,
				},
				frame: err.frame,
			});
		}

		return result;
	};
}
