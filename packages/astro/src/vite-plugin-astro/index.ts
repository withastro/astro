import * as astro from 'vite-plugin-astro';
import type { AstroSettings } from '../types/astro.js';
import { AggregateError, AstroErrorData, CompilerError, CSSError } from '../core/errors/index.js';
import { getFileInfo } from '../vite-plugin-utils/index.js';

interface Options {
	settings: AstroSettings;
}

export async function vitePluginAstro({ settings: { config, preferences } }: Options) {
	return astro.default({
		transformOptions: {
			annotateSourceFile:
				config.devToolbar.enabled && (await preferences.get('devToolbar.enabled')),
			compact: config.compressHTML,
			// TODO: remove in Astro v7
			astroGlobalArgs: JSON.stringify(config.site),
			scopedStyleStrategy: config.scopedStyleStrategy,
			sourcemap: 'both',
			internalURL: 'astro/compiler-runtime',
			resultScopedSlot: true,
			transitionsAnimationURL: 'astro/components/viewtransitions.css',
		},
		transform: (filename, code) => {
			const { fileId: file, fileUrl: url } = getFileInfo(filename, config);

			const SUFFIX = `\nconst $$file = ${JSON.stringify(file)};\nconst $$url = ${JSON.stringify(
				url,
			)};export { $$file as file, $$url as url };\n`;

			return code + SUFFIX;
		},
		handleError: (error) => {
			function createCSSError(err: astro.CSSError): CSSError {
				return new CSSError({
					...(err.kind === undefined
						? {
								name: 'CSSError',
							}
						: err.kind === 'syntax'
							? AstroErrorData.CSSSyntaxError
							: AstroErrorData.UnknownCSSError),
					hint: err.hint,
					message: err.message,
					stack: err.stack,
					location: err.location,
					frame: err.frame,
				});
			}

			switch (error.type) {
				case 'compiler':
					return new CompilerError({
						name: error.name ?? AstroErrorData.UnknownCompilerError.name,
						title: error.title ?? AstroErrorData.UnknownCompilerError.title,
						hint: error.hint ?? AstroErrorData.UnknownCompilerError.hint,
						message: error.message,
						stack: error.stack,
						location: error.location,
						frame: error.frame,
					});
				case 'css':
					return createCSSError(error);
				case 'aggregate':
					const normalized = error.errors.map((err) => createCSSError(err));
					return new AggregateError({
						...normalized[0],
						errors: normalized,
					});
			}
		},
	});
}
