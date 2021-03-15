import Renderer from '../Renderer';
import Wrapper from './shared/Wrapper';
import Block from '../Block';
import DebugTag from '../../nodes/DebugTag';
import { Identifier } from 'estree';
export default class DebugTagWrapper extends Wrapper {
    node: DebugTag;
    constructor(renderer: Renderer, block: Block, parent: Wrapper, node: DebugTag, _strip_whitespace: boolean, _next_sibling: Wrapper);
    render(block: Block, _parent_node: Identifier, _parent_nodes: Identifier): void;
}
