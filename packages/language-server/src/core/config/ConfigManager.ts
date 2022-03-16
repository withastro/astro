import { get, merge } from 'lodash';
import { VSCodeEmmetConfig } from '@vscode/emmet-helper';
import { LSConfig } from './interfaces';

const defaultLSConfig: LSConfig = {
	astro: {
		enabled: true,
		diagnostics: { enabled: true },
		rename: { enabled: true },
		format: { enabled: true },
		completions: { enabled: true },
		hover: { enabled: true },
		codeActions: { enabled: true },
		selectionRange: { enabled: true },
	},
	typescript: {
		enabled: true,
		diagnostics: { enabled: true },
		hover: { enabled: true },
		completions: { enabled: true },
		definitions: { enabled: true },
		findReferences: { enabled: true },
		documentSymbols: { enabled: true },
		codeActions: { enabled: true },
		rename: { enabled: true },
		selectionRange: { enabled: true },
		signatureHelp: { enabled: true },
		semanticTokens: { enabled: true },
		implementation: { enabled: true },
		typeDefinition: { enabled: true },
	},
	css: {
		enabled: true,
		diagnostics: { enabled: true },
		hover: { enabled: true },
		completions: { enabled: true, emmet: true },
		documentColors: { enabled: true },
		colorPresentations: { enabled: true },
		documentSymbols: { enabled: true },
		selectionRange: { enabled: true },
	},
	html: {
		enabled: true,
		hover: { enabled: true },
		completions: { enabled: true, emmet: true },
		tagComplete: { enabled: true },
		documentSymbols: { enabled: true },
		renameTags: { enabled: true },
		linkedEditing: { enabled: true },
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
	private config: LSConfig = defaultLSConfig;
	private emmetConfig: VSCodeEmmetConfig = {};

	private isTrusted = true;

	updateConfig(config: DeepPartial<LSConfig>): void {
		// Ideally we shouldn't need the merge here because all updates should be valid and complete configs.
		// But since those configs come from the client they might be out of synch with the valid config:
		// We might at some point in the future forget to synch config settings in all packages after updating the config.
		this.config = merge({}, defaultLSConfig, this.config, config);
	}

	updateEmmetConfig(config: VSCodeEmmetConfig) {
		this.emmetConfig = config || {};
	}

	getEmmetConfig(): VSCodeEmmetConfig {
		return this.emmetConfig;
	}

	/**
	 * Whether or not specified setting is enabled
	 * @param key a string which is a path. Example: 'astro.diagnostics.enabled'.
	 */
	enabled(key: string): boolean {
		return !!this.get(key);
	}

	/**
	 * Get a specific setting value
	 * @param key a string which is a path. Example: 'astro.diagnostics.enable'.
	 */
	get<T>(key: string): T {
		return get(this.config, key);
	}

	/**
	 * Get the entire user configuration
	 */
	getFullConfig(): Readonly<LSConfig> {
		return this.config;
	}
}
