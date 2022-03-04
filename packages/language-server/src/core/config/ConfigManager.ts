import { VSCodeEmmetConfig } from '@vscode/emmet-helper';
import { UserPreferences } from 'typescript';
import { merge, get } from 'lodash';

/**
 * Default config for the language server.
 */
 const defaultLSConfig: LSConfig = {
  typescript: {
      enable: true,
      diagnostics: { enable: true },
      hover: { enable: true },
      completions: { enable: true },
      definitions: { enable: true },
      findReferences: { enable: true },
      documentSymbols: { enable: true },
      codeActions: { enable: true },
      rename: { enable: true },
      selectionRange: { enable: true },
      signatureHelp: { enable: true },
      semanticTokens: { enable: true }
  },
  css: {
      enable: true,
      globals: '',
      diagnostics: { enable: true },
      hover: { enable: true },
      completions: { enable: true, emmet: true },
      documentColors: { enable: true },
      colorPresentations: { enable: true },
      documentSymbols: { enable: true },
      selectionRange: { enable: true }
  },
  html: {
      enable: true,
      hover: { enable: true },
      completions: { enable: true, emmet: true },
      tagComplete: { enable: true },
      documentSymbols: { enable: true },
      renameTags: { enable: true },
      linkedEditing: { enable: true }
  },
  astro: {
      enable: true,
      compilerWarnings: {},
      diagnostics: { enable: true },
      rename: { enable: true },
      format: {
        enable: true
      },
      completions: { enable: true },
      hover: { enable: true },
      codeActions: { enable: true },
      selectionRange: { enable: true }
  }
};

/**
* Representation of the language server config.
*/
export interface LSConfig {
  typescript: LSTypescriptConfig;
  css: LSCSSConfig;
  html: LSHTMLConfig;
  astro: LSAstroConfig;
}


export interface LSTypescriptConfig {
  enable: boolean;
  diagnostics: {
      enable: boolean;
  };
  hover: {
      enable: boolean;
  };
  documentSymbols: {
      enable: boolean;
  };
  completions: {
      enable: boolean;
  };
  findReferences: {
      enable: boolean;
  };
  definitions: {
      enable: boolean;
  };
  codeActions: {
      enable: boolean;
  };
  rename: {
      enable: boolean;
  };
  selectionRange: {
      enable: boolean;
  };
  signatureHelp: {
      enable: boolean;
  };
  semanticTokens: {
      enable: boolean;
  };
}

export interface LSCSSConfig {
  enable: boolean;
  globals: string;
  diagnostics: {
      enable: boolean;
  };
  hover: {
      enable: boolean;
  };
  completions: {
      enable: boolean;
      emmet: boolean;
  };
  documentColors: {
      enable: boolean;
  };
  colorPresentations: {
      enable: boolean;
  };
  documentSymbols: {
      enable: boolean;
  };
  selectionRange: {
      enable: boolean;
  };
}

export interface LSHTMLConfig {
  enable: boolean;
  hover: {
      enable: boolean;
  };
  completions: {
      enable: boolean;
      emmet: boolean;
  };
  tagComplete: {
      enable: boolean;
  };
  documentSymbols: {
      enable: boolean;
  };
  renameTags: {
      enable: boolean;
  };
  linkedEditing: {
      enable: boolean;
  };
}

export type CompilerWarningsSettings = Record<string, 'ignore' | 'error'>;

export interface LSAstroConfig {
  enable: boolean;
  compilerWarnings: CompilerWarningsSettings;
  diagnostics: {
      enable: boolean;
  };
  format: {
      enable: boolean;
  };
  rename: {
      enable: boolean;
  };
  completions: {
      enable: boolean;
  };
  hover: {
      enable: boolean;
  };
  codeActions: {
      enable: boolean;
  };
  selectionRange: {
      enable: boolean;
  };
}

export type TsUserConfigLang = 'typescript' | 'javascript';

type DeepPartial<T> = T extends CompilerWarningsSettings
    ? T
    : {
          [P in keyof T]?: DeepPartial<T[P]>;
      };

/**
 * A subset of the JS/TS VS Code settings which
 * are transformed to ts.UserPreferences.
 * It may not be available in other IDEs, that's why the keys are optional.
 */
 export interface TSUserConfig {
  preferences?: TsUserPreferencesConfig;
  suggest?: TSSuggestConfig;
}

/**
 * A subset of the JS/TS VS Code settings which
 * are transformed to ts.UserPreferences.
 */
 export interface TsUserPreferencesConfig {
  importModuleSpecifier: UserPreferences['importModuleSpecifierPreference'];
  quoteStyle: UserPreferences['quotePreference'];
}

/**
 * A subset of the JS/TS VS Code settings which
 * are transformed to ts.UserPreferences.
 */
 export interface TSSuggestConfig {
  //autoImports: UserPreferences['includeCompletionsForModuleExports'];
  includeAutomaticOptionalChainCompletions: boolean | undefined;
  //includeCompletionsForImportStatements: boolean | undefined;
}

export class ConfigManager {
  private config: LSConfig = defaultLSConfig;
  private listeners: Array<(config: ConfigManager) => void> = [];
  private emmetConfig: VSCodeEmmetConfig = {};
  private tsUserPreferences: Record<TsUserConfigLang, UserPreferences> = {
    typescript: {
        includeCompletionsForImportStatements: true,
        includeCompletionsWithInsertText: true,
        includeAutomaticOptionalChainCompletions: true
    },
    javascript: {
        includeCompletionsForImportStatements: true,
        includeCompletionsWithInsertText: true,
        includeAutomaticOptionalChainCompletions: true
    }
  };

  /**
     * Updates config.
     */
   update(config: DeepPartial<LSConfig>): void {
    // Ideally we shouldn't need the merge here because all updates should be valid and complete configs.
    // But since those configs come from the client they might be out of synch with the valid config:
    // We might at some point in the future forget to synch config settings in all packages after updating the config.
    this.config = merge({}, defaultLSConfig, this.config, config);
    // Merge will keep arrays/objects if the new one is empty/has less entries,
    // therefore we need some extra checks if there are new settings
    if (config.astro?.compilerWarnings) {
        this.config.astro.compilerWarnings = config.astro.compilerWarnings;
    }

    this.listeners.forEach((listener) => listener(this));
}

  /**
     * Whether or not specified config is enabled
     * @param key a string which is a path. Example: 'astro.diagnostics.enable'.
     */
  enabled(key: string): boolean {
    return !!this.get(key);
  }

   /**
     * Get specific config
     * @param key a string which is a path. Example: 'astro.diagnostics.enable'.
     */
    get<T>(key: string): T {
        return get(this.config, key);
    }

    /**
    * Register a listener which is invoked when the config changed.
    */
    onChange(callback: (config: ConfigManager) => void): void {
        this.listeners.push(callback);
    }

  updateEmmetConfig(config: VSCodeEmmetConfig): void {
    this.emmetConfig = config || {};
  }

  updateTsJsUserPreferences(config: Record<TsUserConfigLang, TSUserConfig>): void {
    (['typescript', 'javascript'] as const).forEach((lang) => {
        if (config[lang]) {
            this._updateTsUserPreferences(lang, config[lang]);
        }
    });
  }

  private _updateTsUserPreferences(lang: TsUserConfigLang, config: TSUserConfig) {
    this.tsUserPreferences[lang] = {
        ...this.tsUserPreferences[lang],
        importModuleSpecifierPreference: config.preferences?.importModuleSpecifier,
        quotePreference: config.preferences?.quoteStyle,
        includeAutomaticOptionalChainCompletions:
            config.suggest?.includeAutomaticOptionalChainCompletions ?? true,
        includeCompletionsWithInsertText: true
    };
  }

  getEmmetConfig(): VSCodeEmmetConfig {
    return this.emmetConfig;
  }
}
