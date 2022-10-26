export enum AstroErrorCodes {
	// 1xxx are reserved for compiler errors
	StaticRedirectNotAllowed = 2005,
	UnavailableInSSR = 2006,
	// Runtime errors
	GenericRuntimeError = 3000,
	// PostCSS errors
	CssSyntaxError = 4000,
	CssUnknownError = 4001,
	// Vite SSR errors
	FailedToLoadModuleSSR = 5000,
	// Config Errors
	ConfigError = 6000,

	// Markdown Errors
	GenericMarkdownError = 7000,
	MarkdownFrontmatterParseError = 7001,

	// General catch-alls for cases where we have zero information
	UnknownCompilerError = 9000,
	UnknownCompilerCSSError = 9001,
	UnknownViteSSRError = 9002,
	UnknownError = 9999,
}
