/**
 * Representation of the language server config.
 * Make sure that this is kept in sync with the `package.json` of the VS Code extension
 */
export interface LSConfig {
	astro: LSAstroConfig;
	typescript: LSTypescriptConfig;
	html: LSHTMLConfig;
	css: LSCSSConfig;
}

export interface LSAstroConfig {
	enabled: boolean;
	diagnostics: {
		enabled: boolean;
	};
	format: {
		enabled: boolean;
	};
	rename: {
		enabled: boolean;
	};
	completions: {
		enabled: boolean;
	};
	hover: {
		enabled: boolean;
	};
	codeActions: {
		enabled: boolean;
	};
	selectionRange: {
		enabled: boolean;
	};
}

export interface LSTypescriptConfig {
	enabled: boolean;
	diagnostics: {
		enabled: boolean;
	};
	hover: {
		enabled: boolean;
	};
	documentSymbols: {
		enabled: boolean;
	};
	completions: {
		enabled: boolean;
	};
	findReferences: {
		enabled: boolean;
	};
	definitions: {
		enabled: boolean;
	};
	codeActions: {
		enabled: boolean;
	};
	rename: {
		enabled: boolean;
	};
	selectionRange: {
		enabled: boolean;
	};
	signatureHelp: {
		enabled: boolean;
	};
	semanticTokens: {
		enabled: boolean;
	};
	implementation: {
		enabled: boolean;
	};
	typeDefinition: {
		enabled: boolean;
	};
}

export interface LSHTMLConfig {
	enabled: boolean;
	hover: {
		enabled: boolean;
	};
	completions: {
		enabled: boolean;
		emmet: boolean;
	};
	tagComplete: {
		enabled: boolean;
	};
	documentSymbols: {
		enabled: boolean;
	};
	renameTags: {
		enabled: boolean;
	};
	linkedEditing: {
		enabled: boolean;
	};
}

export interface LSCSSConfig {
	enabled: boolean;
	diagnostics: {
		enabled: boolean;
	};
	hover: {
		enabled: boolean;
	};
	completions: {
		enabled: boolean;
		emmet: boolean;
	};
	documentColors: {
		enabled: boolean;
	};
	colorPresentations: {
		enabled: boolean;
	};
	documentSymbols: {
		enabled: boolean;
	};
	selectionRange: {
		enabled: boolean;
	};
}
