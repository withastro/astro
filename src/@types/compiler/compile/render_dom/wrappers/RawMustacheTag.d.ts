import Renderer from '../Renderer';
import Block from '../Block';
import Tag from './shared/Tag';
import Wrapper from './shared/Wrapper';
import MustacheTag from '../../nodes/MustacheTag';
import RawMustacheTag from '../../nodes/RawMustacheTag';
import { Identifier } from 'estree';
export default class RawMustacheTagWrapper extends Tag {
  var: Identifier;
  constructor(renderer: Renderer, block: Block, parent: Wrapper, node: MustacheTag | RawMustacheTag);
  render(block: Block, parent_node: Identifier, _parent_nodes: Identifier): void;
}
