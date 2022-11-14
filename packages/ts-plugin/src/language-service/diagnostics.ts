import type ts from 'typescript/lib/tsserverlibrary';
import { isAstroFilePath } from '../utils.js';

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
		return getSemanticDiagnostics(fileName);
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
