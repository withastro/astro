import { InlayHint } from 'vscode-languageserver';
import { InlayHintKind, Range } from 'vscode-languageserver-types';
import type { ConfigManager } from '../../../core/config';
import type { AstroDocument } from '../../../core/documents';
import type { InlayHintsProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';

export class InlayHintsProviderImpl implements InlayHintsProvider {
	private ts: typeof import('typescript/lib/tsserverlibrary');

	constructor(private languageServiceManager: LanguageServiceManager, private configManager: ConfigManager) {
		this.ts = languageServiceManager.docContext.ts;
	}

	async getInlayHints(document: AstroDocument, range: Range): Promise<InlayHint[]> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const start = tsDoc.offsetAt(tsDoc.getGeneratedPosition(range.start));
		const end = tsDoc.offsetAt(tsDoc.getGeneratedPosition(range.end));

		const tsPreferences = await this.configManager.getTSPreferences(document);

		const inlayHints = lang.provideInlayHints(tsDoc.filePath, { start, length: end - start }, tsPreferences);

		return inlayHints.map((hint) => {
			const result = InlayHint.create(
				tsDoc.getOriginalPosition(tsDoc.positionAt(hint.position)),
				hint.text,
				hint.kind === this.ts.InlayHintKind.Type
					? InlayHintKind.Type
					: hint.kind === this.ts.InlayHintKind.Parameter
					? InlayHintKind.Parameter
					: undefined
			);

			result.paddingLeft = hint.whitespaceBefore;
			result.paddingRight = hint.whitespaceAfter;

			return result;
		});
	}
}
