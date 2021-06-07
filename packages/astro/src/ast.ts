import 'source-map-support/register.js';
import type { Attribute } from '@astrojs/parser';

// AST utility functions

/** Get TemplateNode attribute from name */
export function getAttr(attributes: Attribute[], name: string): Attribute | undefined {
  const attr = attributes.find((a) => a.name === name);
  return attr;
}

/** Get TemplateNode attribute by value */
export function getAttrValue(attributes: Attribute[], name: string): string | undefined {
  if (attributes.length === 0) return '';
  const attr = getAttr(attributes, name);
  if (attr) {
    return attr.value[0]?.data;
  }
}

/** Set TemplateNode attribute value */
export function setAttrValue(attributes: Attribute[], name: string, value: string): void {
  const attr = attributes.find((a) => a.name === name);
  if (attr && attr.value[0]) {
    attr.value[0].data = value;
    attr.value[0].raw = value;
  }
}
