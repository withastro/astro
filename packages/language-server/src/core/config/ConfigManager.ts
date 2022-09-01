import type { VSCodeEmmetConfig } from '@vscode/emmet-helper';
import type { LSConfig, LSCSSConfig, LSHTMLConfig, LSTypescriptConfig } from './interfaces';
import type { Connection, FormattingOptions } from 'vscode-languageserver';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { FormatCodeSettings, UserPreferences } from 'typescript';
import { get, mergeDeep } from '../../utils';

// The default language server configuration is used only in two cases:
// 1. When the client does not support `workspace/configuration` requests and as such, needs a global config
// 2. Inside tests, where we don't have a client connection because.. well.. we don't have a client
// Additionally, the default config is used to set default settings for some settings (ex: formatting settings)
export const defaultLSConfig: LSConfig = {
	typescript: {
		enabled: true,
		allowArbitraryAttributes: false,
		diagnostics: { enabled: true },
		hover: { enabled: true },
		completions: { enabled: true },
		definitions: { enabled: true },
		documentSymbols: { enabled: true },
		codeActions: { enabled: true },
		rename: { enabled: true },
		signatureHelp: { enabled: true },
		semanticTokens: { enabled: true },
	},
	css: {
		enabled: true,
		hover: { enabled: true },
		completions: { enabled: true, emmet: true },
		documentColors: { enabled: true },
		documentSymbols: { enabled: true },
	},
	html: {
		enabled: true,
		hover: { enabled: true },
		completions: { enabled: true, emmet: true },
		tagComplete: { enabled: true },
		documentSymbols: { enabled: true },
	},
	format: {
		indentFrontmatter: false,
		newLineAfterFrontmatter: true,
	},
};

type DeepPartial<T> = T extends Record<string, unknown>
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
	  }
	: T;

/**
 * Manager class to facilitate accessing and updating the user's config
 * Not to be confused with other kind of configurations (such as the Astro project configuration and the TypeScript/Javascript one)
 * For more info on this, see the [internal docs](../../../../../docs/internal/language-server/config.md)
 */
export class ConfigManager {
	private globalConfig: Record<string, any> = { astro: defaultLSConfig };
	private documentSettings: Record<string, Record<string, Promise<any>>> = {};

	// If set to true, the next time we need a TypeScript language service, we'll rebuild it so it gets the new config
	public shouldRefreshTSServices = false;
	private isTrusted = true;

	constructor(private connection?: Connection, private hasConfigurationCapability?: boolean) {}

	updateConfig() {
		// Reset all cached document settings
		this.documentSettings = {};
		this.shouldRefreshTSServices = true;
	}

	removeDocument(scopeUri: string) {
		delete this.documentSettings[scopeUri];
	}

	async getConfig<T>(section: string, scopeUri: string): Promise<T | Record<string, any>> {
		if (!this.connection || !this.hasConfigurationCapability) {
			return get<T>(this.globalConfig, section) ?? {};
		}

		if (!this.documentSettings[scopeUri]) {
			this.documentSettings[scopeUri] = {};
		}

		if (!this.documentSettings[scopeUri][section]) {
			this.documentSettings[scopeUri][section] = await this.connection.workspace.getConfiguration({
				scopeUri,
				section,
			});
		}

		return this.documentSettings[scopeUri][section];
	}

	async getEmmetConfig(document: TextDocument): Promise<VSCodeEmmetConfig> {
		const emmetConfig = (await this.getConfig<VSCodeEmmetConfig>('emmet', document.uri)) ?? {};

		return {
			...emmetConfig, // The VSCodeEmmetConfig type is strangely incomplete, so we spread the rest of the config
			preferences: emmetConfig.preferences ?? {},
			showExpandedAbbreviation: emmetConfig.showExpandedAbbreviation ?? 'always',
			showAbbreviationSuggestions: emmetConfig.showAbbreviationSuggestions ?? true,
			syntaxProfiles: emmetConfig.syntaxProfiles ?? {},
			variables: emmetConfig.variables ?? {},
			excludeLanguages: emmetConfig.excludeLanguages ?? [],
			showSuggestionsAsSnippets: emmetConfig.showSuggestionsAsSnippets ?? false,
		};
	}

	async getPrettierVSConfig(document: TextDocument): Promise<Record<string, any>> {
		const prettierVSConfig = (await this.getConfig<Record<string, any>>('prettier', document.uri)) ?? {};

		return prettierVSConfig;
	}

	async getTSFormatConfig(document: TextDocument, vscodeOptions?: FormattingOptions): Promise<FormatCodeSettings> {
		const formatConfig = (await this.getConfig<FormatCodeSettings>('typescript.format', document.uri)) ?? {};

		return {
			tabSize: vscodeOptions?.tabSize,
			indentSize: vscodeOptions?.tabSize,
			convertTabsToSpaces: vscodeOptions?.insertSpaces,
			// We can use \n here since the editor normalizes later on to its line endings.
			newLineCharacter: '\n',
			insertSpaceAfterCommaDelimiter: formatConfig.insertSpaceAfterCommaDelimiter ?? true,
			insertSpaceAfterConstructor: formatConfig.insertSpaceAfterConstructor ?? false,
			insertSpaceAfterSemicolonInForStatements: formatConfig.insertSpaceAfterSemicolonInForStatements ?? true,
			insertSpaceBeforeAndAfterBinaryOperators: formatConfig.insertSpaceBeforeAndAfterBinaryOperators ?? true,
			insertSpaceAfterKeywordsInControlFlowStatements:
				formatConfig.insertSpaceAfterKeywordsInControlFlowStatements ?? true,
			insertSpaceAfterFunctionKeywordForAnonymousFunctions:
				formatConfig.insertSpaceAfterFunctionKeywordForAnonymousFunctions ?? true,
			insertSpaceBeforeFunctionParenthesis: formatConfig.insertSpaceBeforeFunctionParenthesis ?? false,
			insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis:
				formatConfig.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis ?? false,
			insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets:
				formatConfig.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets ?? false,
			insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces:
				formatConfig.insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces ?? true,
			insertSpaceAfterOpeningAndBeforeClosingEmptyBraces:
				formatConfig.insertSpaceAfterOpeningAndBeforeClosingEmptyBraces ?? true,
			insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces:
				formatConfig.insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces ?? false,
			insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces:
				formatConfig.insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces ?? false,
			insertSpaceAfterTypeAssertion: formatConfig.insertSpaceAfterTypeAssertion ?? false,
			placeOpenBraceOnNewLineForFunctions: formatConfig.placeOpenBraceOnNewLineForFunctions ?? false,
			placeOpenBraceOnNewLineForControlBlocks: formatConfig.placeOpenBraceOnNewLineForControlBlocks ?? false,
			semicolons: formatConfig.semicolons ?? 'ignore',
		};
	}

	async getTSPreferences(document: TextDocument): Promise<UserPreferences> {
		const config = (await this.getConfig<any>('typescript', document.uri)) ?? {};
		const preferences = (await this.getConfig<any>('typescript.preferences', document.uri)) ?? {};

		return {
			quotePreference: getQuoteStylePreference(preferences),
			importModuleSpecifierPreference: getImportModuleSpecifierPreference(preferences),
			importModuleSpecifierEnding: getImportModuleSpecifierEndingPreference(preferences),
			allowTextChangesInNewFiles: document.uri.startsWith('file://'),
			providePrefixAndSuffixTextForRename:
				(preferences.renameShorthandProperties ?? true) === false ? false : preferences.useAliasesForRenames ?? true,
			includeAutomaticOptionalChainCompletions: config.suggest?.includeAutomaticOptionalChainCompletions ?? true,
			includeCompletionsForImportStatements: config.suggest?.includeCompletionsForImportStatements ?? true,
			includeCompletionsWithSnippetText: config.suggest?.includeCompletionsWithSnippetText ?? true,
			includeCompletionsForModuleExports: config.suggest?.autoImports ?? true,
			allowIncompleteCompletions: true,
			includeCompletionsWithInsertText: true,

			// Inlay Hints
			includeInlayParameterNameHints: getInlayParameterNameHintsPreference(config),
			includeInlayParameterNameHintsWhenArgumentMatchesName: !(
				config.inlayHints?.parameterNames?.suppressWhenArgumentMatchesName ?? true
			),
			includeInlayFunctionParameterTypeHints: config.inlayHints?.parameterTypes?.enabled ?? false,
			includeInlayVariableTypeHints: config.inlayHints?.variableTypes?.enabled ?? false,
			includeInlayPropertyDeclarationTypeHints: config.inlayHints?.propertyDeclarationTypes?.enabled ?? false,
			includeInlayFunctionLikeReturnTypeHints: config.inlayHints?.functionLikeReturnTypes?.enabled ?? false,
			includeInlayEnumMemberValueHints: config.inlayHints?.enumMemberValues?.enabled ?? false,
		};
	}

	/**
	 * Return true if a plugin and an optional feature is enabled
	 */
	async isEnabled(
		document: TextDocument,
		plugin: keyof LSConfig,
		feature?: keyof LSTypescriptConfig | keyof LSCSSConfig | keyof LSHTMLConfig
	): Promise<boolean> {
		const config = (await this.getConfig<any>('astro', document.uri)) ?? {};

		if (config[plugin]) {
			let res = config[plugin].enabled ?? true;
			if (feature && config[plugin][feature]) {
				res = (res && config[plugin][feature].enabled) ?? true;
			}
			return res;
		}

		return true;
	}

	/**
	 * Updating the global config should only be done in cases where the client doesn't support `workspace/configuration`
	 * or inside of tests.
	 *
	 * The `outsideAstro` parameter can be set to true to change configurations in the global scope.
	 * For example, to change TypeScript settings
	 */
	updateGlobalConfig(config: DeepPartial<LSConfig> | any, outsideAstro?: boolean) {
		if (outsideAstro) {
			this.globalConfig = mergeDeep({}, this.globalConfig, config);
		} else {
			this.globalConfig.astro = mergeDeep({}, defaultLSConfig, this.globalConfig.astro, config);
		}

		this.shouldRefreshTSServices = true;
	}
}

function getQuoteStylePreference(config: any) {
	switch (config.quoteStyle as string) {
		case 'single':
			return 'single';
		case 'double':
			return 'double';
		default:
			return 'auto';
	}
}

function getImportModuleSpecifierPreference(config: any) {
	switch (config.importModuleSpecifier as string) {
		case 'project-relative':
			return 'project-relative';
		case 'relative':
			return 'relative';
		case 'non-relative':
			return 'non-relative';
		default:
			return undefined;
	}
}

function getImportModuleSpecifierEndingPreference(config: any) {
	switch (config.importModuleSpecifierEnding as string) {
		case 'minimal':
			return 'minimal';
		case 'index':
			return 'index';
		case 'js':
			return 'js';
		default:
			return 'auto';
	}
}

function getInlayParameterNameHintsPreference(config: any) {
	switch (config.inlayHints?.parameterNames?.enabled) {
		case 'none':
			return 'none';
		case 'literals':
			return 'literals';
		case 'all':
			return 'all';
		default:
			return undefined;
	}
}
