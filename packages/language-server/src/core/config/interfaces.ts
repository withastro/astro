/**
 * Representation of the language server config.
 * Make sure that this is kept in sync with the `package.json` of the VS Code extension
 */
export interface LSConfig {
	typescript?: LSTypescriptConfig;
	html?: LSHTMLConfig;
	css?: LSCSSConfig;
	format?: LSFormatConfig;
}

export interface LSFormatConfig {
	indentFrontmatter?: boolean;
	newLineAfterFrontmatter?: boolean;
}

export interface LSTypescriptConfig {
	enabled?: boolean;
	allowArbitraryAttributes?: boolean;
	diagnostics?: {
		enabled?: boolean;
	};
	hover?: {
		enabled?: boolean;
	};
	documentSymbols?: {
		enabled?: boolean;
	};
	completions?: {
		enabled?: boolean;
	};
	definitions?: {
		enabled?: boolean;
	};
	codeActions?: {
		enabled?: boolean;
	};
	rename?: {
		enabled?: boolean;
	};
	signatureHelp?: {
		enabled?: boolean;
	};
	semanticTokens?: {
		enabled?: boolean;
	};
}

export interface LSHTMLConfig {
	enabled?: boolean;
	hover?: {
		enabled?: boolean;
	};
	completions?: {
		enabled?: boolean;
		emmet?: boolean;
	};
	tagComplete?: {
		enabled?: boolean;
	};
	documentSymbols?: {
		enabled?: boolean;
	};
}

export interface LSCSSConfig {
	enabled?: boolean;
	hover?: {
		enabled?: boolean;
	};
	completions?: {
		enabled?: boolean;
		emmet?: boolean;
	};
	documentColors?: {
		enabled?: boolean;
	};
	documentSymbols?: {
		enabled?: boolean;
	};
}
