import type { Expression, TemplateNode } from '@astrojs/parser';

export interface Attribute {
  start: number;
  end: number;
  type: 'Attribute' | 'Spread';
  name: string;
  value: TemplateNode[] | boolean;
  expression?: Expression;
}