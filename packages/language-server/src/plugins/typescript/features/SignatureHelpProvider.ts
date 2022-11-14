import type ts from 'typescript';
import {
	CancellationToken,
	MarkupKind,
	ParameterInformation,
	Position,
	SignatureHelp,
	SignatureHelpContext,
	SignatureHelpTriggerKind,
	SignatureInformation,
} from 'vscode-languageserver';
import type { AstroDocument } from '../../../core/documents';
import type { SignatureHelpProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import { getMarkdownDocumentation } from '../previewer';
import type { AstroSnapshot } from '../snapshots/DocumentSnapshot';
import { getScriptTagSnapshot } from '../utils';

export class SignatureHelpProviderImpl implements SignatureHelpProvider {
	private ts: typeof import('typescript/lib/tsserverlibrary');

	constructor(private languageServiceManager: LanguageServiceManager) {
		this.ts = languageServiceManager.docContext.ts;
	}

	private static readonly triggerCharacters = ['(', ',', '<'];
	private static readonly retriggerCharacters = [')'];

	async getSignatureHelp(
		document: AstroDocument,
		position: Position,
		context: SignatureHelpContext | undefined,
		cancellationToken?: CancellationToken
	): Promise<SignatureHelp | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		if (cancellationToken?.isCancellationRequested) {
			return null;
		}

		const offset = tsDoc.offsetAt(tsDoc.getGeneratedPosition(position));
		const node = document.html.findNodeAt(offset);

		let info: ts.SignatureHelpItems | undefined;

		const triggerReason = this.toTsTriggerReason(context);

		if (node.tag === 'script') {
			const { filePath: scriptFilePath, offset: scriptOffset } = getScriptTagSnapshot(
				tsDoc as AstroSnapshot,
				document,
				node,
				position
			);

			info = lang.getSignatureHelpItems(scriptFilePath, scriptOffset, triggerReason ? { triggerReason } : undefined);
		} else {
			info = lang.getSignatureHelpItems(tsDoc.filePath, offset, triggerReason ? { triggerReason } : undefined);
		}

		if (!info) {
			return null;
		}

		const signatures = info.items.map((item) => this.toSignatureHelpInformation(item, this.ts));

		return {
			signatures,
			activeSignature: info.selectedItemIndex,
			activeParameter: info.argumentIndex,
		};
	}

	private isReTrigger(
		isRetrigger: boolean,
		triggerCharacter: string
	): triggerCharacter is ts.SignatureHelpRetriggerCharacter {
		return (
			isRetrigger &&
			(this.isTriggerCharacter(triggerCharacter) ||
				SignatureHelpProviderImpl.retriggerCharacters.includes(triggerCharacter))
		);
	}

	private isTriggerCharacter(triggerCharacter: string): triggerCharacter is ts.SignatureHelpTriggerCharacter {
		return SignatureHelpProviderImpl.triggerCharacters.includes(triggerCharacter);
	}

	/**
	 * adopted from https://github.com/microsoft/vscode/blob/265a2f6424dfbd3a9788652c7d376a7991d049a3/extensions/typescript-language-features/src/languageFeatures/signatureHelp.ts#L103
	 */
	private toTsTriggerReason(context: SignatureHelpContext | undefined): ts.SignatureHelpTriggerReason {
		switch (context?.triggerKind) {
			case SignatureHelpTriggerKind.TriggerCharacter:
				if (context.triggerCharacter) {
					if (this.isReTrigger(context.isRetrigger, context.triggerCharacter)) {
						return { kind: 'retrigger', triggerCharacter: context.triggerCharacter };
					}
					if (this.isTriggerCharacter(context.triggerCharacter)) {
						return {
							kind: 'characterTyped',
							triggerCharacter: context.triggerCharacter,
						};
					}
				}
				return { kind: 'invoked' };
			case SignatureHelpTriggerKind.ContentChange:
				return context.isRetrigger ? { kind: 'retrigger' } : { kind: 'invoked' };

			case SignatureHelpTriggerKind.Invoked:
			default:
				return { kind: 'invoked' };
		}
	}

	/**
	 * adopted from https://github.com/microsoft/vscode/blob/265a2f6424dfbd3a9788652c7d376a7991d049a3/extensions/typescript-language-features/src/languageFeatures/signatureHelp.ts#L73
	 */
	private toSignatureHelpInformation(
		item: ts.SignatureHelpItem,
		ts: typeof import('typescript/lib/tsserverlibrary')
	): SignatureInformation {
		const [prefixLabel, separatorLabel, suffixLabel] = [
			item.prefixDisplayParts,
			item.separatorDisplayParts,
			item.suffixDisplayParts,
		].map(this.ts.displayPartsToString);

		let textIndex = prefixLabel.length;
		let signatureLabel = '';
		const parameters: ParameterInformation[] = [];
		const lastIndex = item.parameters.length - 1;

		item.parameters.forEach((parameter, index) => {
			const label = ts.displayPartsToString(parameter.displayParts);

			const startIndex = textIndex;
			const endIndex = textIndex + label.length;
			const doc = ts.displayPartsToString(parameter.documentation);

			signatureLabel += label;
			parameters.push(ParameterInformation.create([startIndex, endIndex], doc));

			if (index < lastIndex) {
				textIndex = endIndex + separatorLabel.length;
				signatureLabel += separatorLabel;
			}
		});
		const signatureDocumentation = getMarkdownDocumentation(
			item.documentation,
			item.tags.filter((tag) => tag.name !== 'param'),
			ts
		);

		return {
			label: prefixLabel + signatureLabel + suffixLabel,
			documentation: signatureDocumentation
				? {
						value: signatureDocumentation,
						kind: MarkupKind.Markdown,
				  }
				: undefined,
			parameters,
		};
	}
}
