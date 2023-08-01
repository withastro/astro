import type { Tokenizer } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import type { MarkdocIntegrationOptions } from './options.js';

type TokenizerOptions = ConstructorParameters<typeof Tokenizer>[0];

export function getMarkdocTokenizer(options: MarkdocIntegrationOptions | undefined): Tokenizer {
	const key = cacheKey(options);

	if (!_cachedMarkdocTokenizers[key]) {
		const tokenizerOptions: TokenizerOptions = {
			// Strip <!-- comments --> from rendered output
			// Without this, they're rendered as strings!
			allowComments: true,
		};

		if (options?.allowHTML) {
			// we want to allow indentation for Markdoc tags that are interleaved inside HTML block elements
			tokenizerOptions.allowIndentation = true;
			// enable HTML token detection in markdown-it
			tokenizerOptions.html = true;
		}

		_cachedMarkdocTokenizers[key] = new Markdoc.Tokenizer(tokenizerOptions);
	}

	return _cachedMarkdocTokenizers[key];
}

// create this on-demand when needed since it relies on the runtime MarkdocIntegrationOptions and may change during
// the life of module in certain scenarios (unit tests, etc.)
let _cachedMarkdocTokenizers: Record<string, Tokenizer> = {};

function cacheKey(options: MarkdocIntegrationOptions | undefined): string {
	return JSON.stringify(options);
}
