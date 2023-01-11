import ts from 'typescript/lib/tsserverlibrary';
import { isAstroFilePath } from '../utils.js';

export enum DiagnosticCodes {
	CANNOT_FIND_MODULE = 2307, // Cannot find module '{0}' or its corresponding type declarations.
}

export function decorateDiagnostics(ls: ts.LanguageService): void {
	decorateSyntacticDiagnostics(ls);
	decorateSemanticDiagnostics(ls);
	decorateSuggestionDiagnostics(ls);
}

function decorateSyntacticDiagnostics(ls: ts.LanguageService): void {
	const getSyntacticDiagnostics = ls.getSyntacticDiagnostics;
	ls.getSyntacticDiagnostics = (fileName: string) => {
		// Diagnostics inside Astro files are done
		// by the @astrojs/language-server / Astro for VS Code extension
		if (isAstroFilePath(fileName)) {
			return [];
		}
		return getSyntacticDiagnostics(fileName);
	};
}

function decorateSemanticDiagnostics(ls: ts.LanguageService): void {
	const getSemanticDiagnostics = ls.getSemanticDiagnostics;
	ls.getSemanticDiagnostics = (fileName: string) => {
		// Diagnostics inside Astro files are done
		// by the @astrojs/language-server / Astro for VS Code extension
		if (isAstroFilePath(fileName)) {
			return [];
		}

		let diagnostics = getSemanticDiagnostics(fileName);
		diagnostics = diagnostics.map((diag) => {
			const message = ts.flattenDiagnosticMessageText(diag.messageText, ts.sys.newLine);
			if (
				diag.code === DiagnosticCodes.CANNOT_FIND_MODULE &&
				message.includes('astro:content') &&
				// TypeScript will keep the diagnostics here in cache, so if we just blindly always add to it, our added message will be there twice
				// Not sure if there's a generic way to ensure that we only add it once, so for now we'll just check for the message we want to add
				!message.includes('content collections')
			) {
				diag.messageText =
					message +
					`${ts.sys.newLine}${ts.sys.newLine}` +
					"If you're using content collections, make sure to run `astro dev`, `astro build` or `astro sync` to first generate the types so you can import from them. If you already ran one of those commands, restarting the TS Server might be necessary in order for the change to take effect";
			}

			return diag;
		});

		return diagnostics;
	};
}

function decorateSuggestionDiagnostics(ls: ts.LanguageService): void {
	const getSuggestionDiagnostics = ls.getSuggestionDiagnostics;
	ls.getSuggestionDiagnostics = (fileName: string) => {
		// Diagnostics inside Astro files are done
		// by the @astrojs/language-server / Astro for VS Code extension
		if (isAstroFilePath(fileName)) {
			return [];
		}
		return getSuggestionDiagnostics(fileName);
	};
}
