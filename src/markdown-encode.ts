import type { HtmlExtension, Token } from 'micromark/dist/shared-types';

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

const plugin: HtmlExtension = {
  exit: {
    codeFlowValue() {
      const token: Token = arguments[0];
      const serialize = (this.sliceSerialize as unknown) as (t: Token) => string;
      const raw = (this.raw as unknown) as (s: string) => void;
      const value = serialize(token);
      raw(encode(value));
    },
  },
};

export { plugin as default };
