import { InlayHint } from 'vscode-languageserver';
import { AstroDocument } from '../../../core/documents';
import { InlayHintsProvider } from '../../interfaces';
import { LanguageServiceManager } from '../LanguageServiceManager';
import { toVirtualAstroFilePath } from '../utils';
import { InlayHintKind, Range } from 'vscode-languageserver-types';
import ts from 'typescript';
import { ConfigManager } from '../../../core/config';

export class InlayHintsProviderImpl implements InlayHintsProvider {
	constructor(private languageServiceManager: LanguageServiceManager, private configManager: ConfigManager) {}

	async getInlayHints(document: AstroDocument, range: Range): Promise<InlayHint[]> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const filePath = toVirtualAstroFilePath(tsDoc.filePath);
		const fragment = await tsDoc.createFragment();

		const start = fragment.offsetAt(fragment.getGeneratedPosition(range.start));
		const end = fragment.offsetAt(fragment.getGeneratedPosition(range.end));

		const tsPreferences = await this.configManager.getTSInlayHintsPreferences(document);

		const inlayHints = lang.provideInlayHints(filePath, { start, length: end - start }, tsPreferences);

		return inlayHints.map((hint) => {
			const result = InlayHint.create(
				fragment.getOriginalPosition(fragment.positionAt(hint.position)),
				hint.text,
				hint.kind === ts.InlayHintKind.Type
					? InlayHintKind.Type
					: hint.kind === ts.InlayHintKind.Parameter
					? InlayHintKind.Parameter
					: undefined
			);

			result.paddingLeft = hint.whitespaceBefore;
			result.paddingRight = hint.whitespaceAfter;

			return result;
		});
	}
}
