import type { LanguageServiceManager } from '../LanguageServiceManager';
import ts from 'typescript';
import { Hover, Position } from 'vscode-languageserver';
import { Document, mapObjWithRangeToOriginal } from '../../../core/documents';
import { HoverProvider } from '../../interfaces';
import { getMarkdownDocumentation } from '../previewer';
import { convertRange, toVirtualAstroFilePath } from '../utils';

export class HoverProviderImpl implements HoverProvider {
  constructor(private readonly lang: LanguageServiceManager) {}

  async doHover(document: Document, position: Position): Promise<Hover | null> {
    const { lang, tsDoc } = await this.getLSAndTSDoc(document);
    const fragment = await tsDoc.getFragment();

    const offset = fragment.offsetAt(fragment.getGeneratedPosition(position));
    const filePath = toVirtualAstroFilePath(tsDoc.filePath);
    let info = lang.getQuickInfoAtPosition(filePath, offset);
    if (!info) {
      return null;
    }

    const textSpan = info.textSpan;

    const declaration = ts.displayPartsToString(info.displayParts);
    const documentation = getMarkdownDocumentation(info.documentation, info.tags);

    // https://microsoft.github.io/language-server-protocol/specification#textDocument_hover
    const contents = ['```typescript', declaration, '```'].concat(documentation ? ['---', documentation] : []).join('\n');

    return mapObjWithRangeToOriginal(fragment, {
      range: convertRange(fragment, textSpan),
      contents,
    });
  }

  private async getLSAndTSDoc(document: Document) {
    return this.lang.getTypeScriptDoc(document);
  }
}
