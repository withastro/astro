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
    const child = attr.value[0];
    if (!child) return;
    if (child.type === 'Text') return child.data;
    if (child.type === 'MustacheTag') return child.expression.codeChunks[0];
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
