/**
 * Loads the given languages and adds them to the current Prism instance.
 *
 * If no languages are provided, __all__ Prism languages will be loaded.
 *
 * @param {string|string[]} [languages]
 * @returns {Promise<void>}
 */
export declare function loadLanguages(languages: string | string[]): Promise<void>;
export declare namespace loadLanguages {
	var silent: boolean;
}
