import 'source-map-support/register.js';
import type { Attribute } from 'astro-parser';

// AST utility functions

/** Get TemplateNode attribute from name */
export function getAttr(attributes: Attribute[], name: string): Attribute | undefined {
  const attr = attributes.find((a) => a.name === name);
  return attr;
}

/** Get TemplateNode attribute by value */
export function getAttrValue(attributes: Attribute[], name: string): string | undefined {
  const attr = getAttr(attributes, name);
  if (attr) {
    return attr.value[0]?.data;
  }
}

/** Set TemplateNode attribute value */
export function setAttrValue(attributes: Attribute[], name: string, value: string): void {
  const attr = attributes.find((a) => a.name === name);
  if (attr) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    attr.value[0]!.data = value;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    attr.value[0]!.raw = value;
  }
}
