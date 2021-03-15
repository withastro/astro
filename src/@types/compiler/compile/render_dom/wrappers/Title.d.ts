import Wrapper from './shared/Wrapper';
import Renderer from '../Renderer';
import Block from '../Block';
import Title from '../../nodes/Title';
import { Identifier } from 'estree';
export default class TitleWrapper extends Wrapper {
    node: Title;
    constructor(renderer: Renderer, block: Block, parent: Wrapper, node: Title, _strip_whitespace: boolean, _next_sibling: Wrapper);
    render(block: Block, _parent_node: Identifier, _parent_nodes: Identifier): void;
}
