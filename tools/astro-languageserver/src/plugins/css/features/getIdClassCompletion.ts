import { CompletionItem, CompletionItemKind, CompletionList } from 'vscode-languageserver';
import { AttributeContext } from '../../../core/documents/parseHtml';
import { CSSDocument } from '../CSSDocument';

export function getIdClassCompletion(cssDoc: CSSDocument, attributeContext: AttributeContext): CompletionList | null {
  const collectingType = getCollectingType(attributeContext);

  if (!collectingType) {
    return null;
  }
  const items = collectSelectors(cssDoc.stylesheet as CSSNode, collectingType);

  console.log('getIdClassCompletion items', items.length);
  return CompletionList.create(items);
}

function getCollectingType(attributeContext: AttributeContext): number | undefined {
  if (attributeContext.inValue) {
    if (attributeContext.name === 'class') {
      return NodeType.ClassSelector;
    }
    if (attributeContext.name === 'id') {
      return NodeType.IdentifierSelector;
    }
  } else if (attributeContext.name.startsWith('class:')) {
    return NodeType.ClassSelector;
  }
}

/**
 * incomplete see
 * https://github.com/microsoft/vscode-css-languageservice/blob/master/src/parser/cssNodes.ts#L14
 * The enum is not exported. we have to update this whenever it changes
 */
export enum NodeType {
  ClassSelector = 14,
  IdentifierSelector = 15,
}

export type CSSNode = {
  type: number;
  children: CSSNode[] | undefined;
  getText(): string;
};

export function collectSelectors(stylesheet: CSSNode, type: number) {
  const result: CSSNode[] = [];
  walk(stylesheet, (node) => {
    if (node.type === type) {
      result.push(node);
    }
  });

  return result.map(
    (node): CompletionItem => ({
      label: node.getText().substring(1),
      kind: CompletionItemKind.Keyword,
    })
  );
}

function walk(node: CSSNode, callback: (node: CSSNode) => void) {
  callback(node);
  if (node.children) {
    node.children.forEach((node) => walk(node, callback));
  }
}
