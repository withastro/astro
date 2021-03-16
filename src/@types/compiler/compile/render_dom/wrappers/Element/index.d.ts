import Renderer from '../../Renderer';
import Element from '../../../nodes/Element';
import Wrapper from '../shared/Wrapper';
import Block from '../../Block';
import FragmentWrapper from '../Fragment';
import AttributeWrapper from './Attribute';
import StyleAttributeWrapper from './StyleAttribute';
import SpreadAttributeWrapper from './SpreadAttribute';
import Binding from './Binding';
import { Identifier } from 'estree';
import EventHandler from './EventHandler';
interface BindingGroup {
  events: string[];
  bindings: Binding[];
}
export default class ElementWrapper extends Wrapper {
  node: Element;
  fragment: FragmentWrapper;
  attributes: Array<AttributeWrapper | StyleAttributeWrapper | SpreadAttributeWrapper>;
  bindings: Binding[];
  event_handlers: EventHandler[];
  class_dependencies: string[];
  select_binding_dependencies?: Set<string>;
  var: any;
  void: boolean;
  constructor(renderer: Renderer, block: Block, parent: Wrapper, node: Element, strip_whitespace: boolean, next_sibling: Wrapper);
  render(block: Block, parent_node: Identifier, parent_nodes: Identifier): void;
  can_use_textcontent(): boolean;
  get_render_statement(block: Block): import('estree').Expression;
  get_claim_statement(nodes: Identifier): import('estree').Expression;
  add_directives_in_order(block: Block): void;
  add_bindings(block: Block, binding_group: BindingGroup): void;
  add_this_binding(block: Block, this_binding: Binding): void;
  add_attributes(block: Block): void;
  add_spread_attributes(block: Block): void;
  add_transitions(block: Block): void;
  add_animation(block: Block): void;
  add_classes(block: Block): void;
  add_manual_style_scoping(block: any): void;
}
export {};
