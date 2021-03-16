import Wrapper from './shared/Wrapper';
import Renderer from '../Renderer';
import Block from '../Block';
import AwaitBlock from '../../nodes/AwaitBlock';
import FragmentWrapper from './Fragment';
import PendingBlock from '../../nodes/PendingBlock';
import ThenBlock from '../../nodes/ThenBlock';
import CatchBlock from '../../nodes/CatchBlock';
import { Context } from '../../nodes/shared/Context';
import { Identifier, Literal, Node } from 'estree';
declare type Status = 'pending' | 'then' | 'catch';
declare class AwaitBlockBranch extends Wrapper {
  parent: AwaitBlockWrapper;
  node: PendingBlock | ThenBlock | CatchBlock;
  block: Block;
  fragment: FragmentWrapper;
  is_dynamic: boolean;
  var: any;
  status: Status;
  value: string;
  value_index: Literal;
  value_contexts: Context[];
  is_destructured: boolean;
  constructor(
    status: Status,
    renderer: Renderer,
    block: Block,
    parent: AwaitBlockWrapper,
    node: PendingBlock | ThenBlock | CatchBlock,
    strip_whitespace: boolean,
    next_sibling: Wrapper
  );
  add_context(node: Node | null, contexts: Context[]): void;
  render(block: Block, parent_node: Identifier, parent_nodes: Identifier): void;
  render_destructure(): void;
}
export default class AwaitBlockWrapper extends Wrapper {
  node: AwaitBlock;
  pending: AwaitBlockBranch;
  then: AwaitBlockBranch;
  catch: AwaitBlockBranch;
  var: Identifier;
  constructor(renderer: Renderer, block: Block, parent: Wrapper, node: AwaitBlock, strip_whitespace: boolean, next_sibling: Wrapper);
  render(block: Block, parent_node: Identifier, parent_nodes: Identifier): void;
}
export {};
