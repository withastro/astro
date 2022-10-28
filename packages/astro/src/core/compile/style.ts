import fs from 'fs';
import type { TransformOptions } from '@astrojs/compiler';
import { preprocessCSS, ResolvedConfig } from 'vite';
import { AstroErrorCodes } from '../errors/codes.js';
import { CSSError } from '../errors/errors.js';
import { positionAt } from '../errors/index.js';

export function createStylePreprocessor({
	filename,
	viteConfig,
	cssDeps,
	cssTransformErrors,
}: {
	filename: string;
	viteConfig: ResolvedConfig;
	cssDeps: Set<string>;
	cssTransformErrors: Error[];
}): TransformOptions['preprocessStyle'] {
	return async (content, attrs) => {
		const lang = `.${attrs?.lang || 'css'}`.toLowerCase();
		const id = `${filename}?astro&type=style&lang${lang}`;
		try {
			const result = await preprocessCSS(content, id, viteConfig);
			cssDeps = result.deps ?? cssDeps;

			let map: string | undefined;
			if (result.map) {
				if (typeof result.map === 'string') {
					map = result.map;
				} else if (result.map.mappings) {
					map = result.map.toString();
				}
			}

			return { code: result.code, map };
		} catch (err: any) {
			cssTransformErrors.push(enhanceCSSError(err, filename));
			return { error: err + '' };
		}
	};
}

function enhanceCSSError(err: any, filename: string) {
	const fileContent = fs.readFileSync(filename).toString();
	const styleTagBeginning = fileContent.indexOf(err.input?.source ?? err.code);

	// PostCSS Syntax Error
	if (err.name === 'CssSyntaxError') {
		const errorLine = positionAt(styleTagBeginning, fileContent).line + (err.line ?? 0);

		// Vite will handle creating the frame for us with proper line numbers, no need to create one

		return new CSSError({
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

		return new CSSError({
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

	return new CSSError({
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
