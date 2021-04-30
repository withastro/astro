import type { Token } from 'micromark/dist/shared-types';
import type { MicromarkExtension, MicromarkExtensionContext } from '../../@types/micromark';

const characterReferences = {
  '"': 'quot',
  '&': 'amp',
  '<': 'lt',
  '>': 'gt',
  '{': 'lbrace',
  '}': 'rbrace',
};

type EncodedChars = '"' | '&' | '<' | '>' | '{' | '}';

/** Encode HTML entity */
function encode(value: string): string {
  return value.replace(/["&<>{}]/g, (raw: string) => {
    return '&' + characterReferences[raw as EncodedChars] + ';';
  });
}

/** Encode Markdown node */
function encodeToken(this: MicromarkExtensionContext) {
  const token: Token = arguments[0];
  const value = this.sliceSerialize(token);
  this.raw(encode(value));
}

const plugin: MicromarkExtension = {
  exit: {
    codeTextData: encodeToken,
    codeFlowValue: encodeToken,
  },
};

export { plugin as encodeMarkdown };
