import type ts from 'typescript/lib/tsserverlibrary';
import { Range, SymbolInformation, SymbolKind, SymbolTag } from 'vscode-languageserver-types';
import { AstroDocument } from '../../../core/documents';
import type { DocumentSymbolsProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import { symbolKindFromString } from '../utils';

export class DocumentSymbolsProviderImpl implements DocumentSymbolsProvider {
	private ts: typeof import('typescript/lib/tsserverlibrary');

	constructor(private languageServiceManager: LanguageServiceManager) {
		this.ts = languageServiceManager.docContext.ts;
	}

	async getDocumentSymbols(document: AstroDocument): Promise<SymbolInformation[]> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const navTree = lang.getNavigationTree(tsDoc.filePath + '?documentSymbols');
		if (!navTree) {
			return [];
		}

		const symbols: SymbolInformation[] = [];
		this.collectSymbols(navTree, document, undefined, (symbol) => symbols.push(symbol));

		const originalContainerName = symbols[0].name;
		const result: SymbolInformation[] = [];

		// Add a "Frontmatter" namespace for the frontmatter if we have a closed one
		if (document.astroMeta.frontmatter.state === 'closed') {
			result.push(
				SymbolInformation.create(
					'Frontmatter',
					SymbolKind.Namespace,
					Range.create(
						document.positionAt(document.astroMeta.frontmatter.startOffset as number),
						document.positionAt(document.astroMeta.frontmatter.endOffset as number)
					),
					document.getURL()
				)
			);
		}

		// Add a "Template" namespace for everything under the frontmatter
		result.push(
			SymbolInformation.create(
				'Template',
				SymbolKind.Namespace,
				Range.create(
					document.positionAt(document.astroMeta.frontmatter.endOffset ?? 0),
					document.positionAt(document.getTextLength())
				),
				document.getURL()
			)
		);

		for (let symbol of symbols.splice(1)) {
			if (document.offsetAt(symbol.location.range.end) >= (document.astroMeta.content.firstNonWhitespaceOffset ?? 0)) {
				if (symbol.containerName === originalContainerName) {
					symbol.containerName = 'Template';
				}

				// For some reason, it seems like TypeScript thinks that the "class" attribute is a real class, weird
				if (symbol.kind === SymbolKind.Class && symbol.name === '<class>') {
					const node = document.html.findNodeAt(document.offsetAt(symbol.location.range.start));
					if (node.attributes?.class) {
						continue;
					}
				}
			}

			// Remove the exported function in our TSX output from the symbols
			if (document.offsetAt(symbol.location.range.start) >= document.getTextLength()) {
				continue;
			}

			result.push(symbol);
		}

		return result;
	}

	private collectSymbols(
		item: ts.NavigationTree,
		document: AstroDocument,
		container: string | undefined,
		cb: (symbol: SymbolInformation) => void
	) {
		for (const span of item.spans) {
			const symbol = SymbolInformation.create(
				item.text,
				symbolKindFromString(item.kind),
				Range.create(document.positionAt(span.start), document.positionAt(span.start + span.length)),
				document.getURL(),
				container
			);

			// TypeScript gives us kind modifiers as a string instead of an array
			const kindModifiers = new Set(item.kindModifiers.split(/,|\s+/g));
			if (kindModifiers.has(this.ts.ScriptElementKindModifier.deprecatedModifier)) {
				if (!symbol.tags) symbol.tags = [];
				symbol.tags.push(SymbolTag.Deprecated);
			}

			cb(symbol);
		}

		if (item.childItems) {
			for (const child of item.childItems) {
				this.collectSymbols(child, document, item.text, cb);
			}
		}
	}
}
