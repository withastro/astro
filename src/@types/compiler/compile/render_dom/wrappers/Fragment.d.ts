import Wrapper from './shared/Wrapper';
import { INode } from '../../nodes/interfaces';
import Renderer from '../Renderer';
import Block from '../Block';
import { Identifier } from 'estree';
export default class FragmentWrapper {
    nodes: Wrapper[];
    constructor(renderer: Renderer, block: Block, nodes: INode[], parent: Wrapper, strip_whitespace: boolean, next_sibling: Wrapper);
    render(block: Block, parent_node: Identifier, parent_nodes: Identifier): void;
}
