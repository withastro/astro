import Wrapper from '../shared/Wrapper';
import Renderer from '../../Renderer';
import Block from '../../Block';
import InlineComponent from '../../../nodes/InlineComponent';
import FragmentWrapper from '../Fragment';
import TemplateScope from '../../../nodes/shared/TemplateScope';
import { Node, Identifier } from 'estree';
declare type SlotDefinition = {
  block: Block;
  scope: TemplateScope;
  get_context?: Node;
  get_changes?: Node;
};
export default class InlineComponentWrapper extends Wrapper {
  var: Identifier;
  slots: Map<string, SlotDefinition>;
  node: InlineComponent;
  fragment: FragmentWrapper;
  children: Array<Wrapper | FragmentWrapper>;
  constructor(renderer: Renderer, block: Block, parent: Wrapper, node: InlineComponent, strip_whitespace: boolean, next_sibling: Wrapper);
  set_slot(name: string, slot_definition: SlotDefinition): void;
  warn_if_reactive(): void;
  render(block: Block, parent_node: Identifier, parent_nodes: Identifier): void;
}
export {};
