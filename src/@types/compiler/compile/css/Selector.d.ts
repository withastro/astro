import MagicString from 'magic-string';
import Stylesheet from './Stylesheet';
import { CssNode } from './interfaces';
import Component from '../Component';
import Element from '../nodes/Element';
export default class Selector {
  node: CssNode;
  stylesheet: Stylesheet;
  blocks: Block[];
  local_blocks: Block[];
  used: boolean;
  constructor(node: CssNode, stylesheet: Stylesheet);
  apply(node: Element): void;
  minify(code: MagicString): void;
  transform(code: MagicString, attr: string, max_amount_class_specificity_increased: number): void;
  validate(component: Component): void;
  get_amount_class_specificity_increased(): number;
}
declare class Block {
  global: boolean;
  host: boolean;
  combinator: CssNode;
  selectors: CssNode[];
  start: number;
  end: number;
  should_encapsulate: boolean;
  constructor(combinator: CssNode);
  add(selector: CssNode): void;
}
export {};
