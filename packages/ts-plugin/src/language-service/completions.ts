import type ts from 'typescript/lib/tsserverlibrary';
import type { Logger } from '../logger.js';
import { isAstroFilePath, replaceDeep } from '../utils.js';

const componentPostfix = '__AstroComponent_';

export function decorateCompletions(ls: ts.LanguageService, logger: Logger): void {
	const getCompletionsAtPosition = ls.getCompletionsAtPosition;
	ls.getCompletionsAtPosition = (fileName, position, options) => {
		const completions = getCompletionsAtPosition(fileName, position, options);
		if (!completions) {
			return completions;
		}
		return {
			...completions,
			entries: completions.entries.map((entry) => {
				if (!isAstroFilePath(entry.source || '') || !entry.name.endsWith(componentPostfix)) {
					return entry;
				}
				return {
					...entry,
					name: entry.name.slice(0, -componentPostfix.length),
				};
			}),
		};
	};

	const getCompletionEntryDetails = ls.getCompletionEntryDetails;
	ls.getCompletionEntryDetails = (fileName, position, entryName, formatOptions, source, preferences, data) => {
		if (!isAstroFilePath(source || '')) {
			const details = getCompletionEntryDetails(
				fileName,
				position,
				entryName,
				formatOptions,
				source,
				preferences,
				data
			);

			if (details) {
				return details;
			}
		}

		// In the completion list we removed the component postfix. Internally,
		// the language service saved the list with the postfix, so details
		// won't match anything. Therefore add it back and remove it afterwards again.
		const astroDetails = getCompletionEntryDetails(
			fileName,
			position,
			entryName + componentPostfix,
			formatOptions,
			source,
			preferences,
			data
		);
		if (!astroDetails) {
			return undefined;
		}
		logger.debug('Found Astro Component import completion details');

		return replaceDeep(astroDetails, componentPostfix, '');
	};
}
