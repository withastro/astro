import { DiagnosticMessage } from '@astrojs/compiler/shared/types';
import type ts from 'typescript';
import { Diagnostic, Range } from 'vscode-languageserver-types';
import { AstroDocument } from '../../../core/documents';
import { DiagnosticsProvider } from '../../interfaces';
import { LanguageServiceManager } from '../../typescript/LanguageServiceManager';
import { AstroSnapshot } from '../../typescript/snapshots/DocumentSnapshot';

export class DiagnosticsProviderImpl implements DiagnosticsProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async getDiagnostics(document: AstroDocument): Promise<Diagnostic[]> {
		const { tsDoc } = (await this.languageServiceManager.getLSAndTSDoc(document)) as {
			tsDoc: AstroSnapshot;
			lang: ts.LanguageService;
		};

		return tsDoc.compilerDiagnostics.map(this.compilerMessageToDiagnostic);
	}

	private compilerMessageToDiagnostic(message: DiagnosticMessage): Diagnostic {
		return {
			message: message.text + '\n\n' + message.hint,
			range: Range.create(
				message.location.line - 1,
				message.location.column - 1,
				message.location.line,
				message.location.length
			),
			code: message.code,
			severity: message.severity,
			source: 'astro',
		};
	}
}
