import type { HtmlExtension, Token, Tokenize } from 'micromark/dist/shared-types';

const characterReferences = {
  '"': 'quot',
  '&': 'amp',
  '<': 'lt',
  '>': 'gt',
  '{': 'lbrace',
  '}': 'rbrace',
};

type EncodedChars = '"' | '&' | '<' | '>' | '{' | '}';

function encode(value: string): string {
  return value.replace(/["&<>{}]/g, (raw: string) => {
    return '&' + characterReferences[raw as EncodedChars] + ';';
  });
}

function encodeToken(this: Record<string, () => void>) {
  const token: Token = arguments[0];
  const serialize = (this.sliceSerialize as unknown) as (t: Token) => string;
  const raw = (this.raw as unknown) as (s: string) => void;
  const value = serialize(token);
  raw(encode(value));
}

const plugin: HtmlExtension = {
  exit: {
    codeTextData: encodeToken,
    codeFlowValue: encodeToken,
  },
};

export { plugin as encodeMarkdown };