import type { Attribute } from './parser/interfaces';

// AST utility functions

export function getAttr(attributes: Attribute[], name: string): Attribute | undefined {
  const attr = attributes.find((a) => a.name === name);
  return attr;
}

export function getAttrValue(attributes: Attribute[], name: string): string | undefined {
  const attr = getAttr(attributes, name);
  if (attr) {
    return attr.value[0]?.data;
  }
}

export function setAttrValue(attributes: Attribute[], name: string, value: string): void {
  const attr = attributes.find((a) => a.name === name);
  if (attr) {
    attr.value[0]!.data = value;
    attr.value[0]!.raw = value;
  }
}
