import Wrapper from './shared/Wrapper';
import Renderer from '../Renderer';
import Block from '../Block';
import Slot from '../../nodes/Slot';
import FragmentWrapper from './Fragment';
import { Identifier } from 'estree';
export default class SlotWrapper extends Wrapper {
  node: Slot;
  fragment: FragmentWrapper;
  fallback: Block | null;
  slot_block: Block;
  var: Identifier;
  dependencies: Set<string>;
  constructor(renderer: Renderer, block: Block, parent: Wrapper, node: Slot, strip_whitespace: boolean, next_sibling: Wrapper);
  render(block: Block, parent_node: Identifier, parent_nodes: Identifier): void;
  is_dependency_dynamic(name: string): boolean;
}
