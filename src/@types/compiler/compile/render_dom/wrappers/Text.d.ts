import Renderer from '../Renderer';
import Block from '../Block';
import Text from '../../nodes/Text';
import Wrapper from './shared/Wrapper';
import { Identifier } from 'estree';
export default class TextWrapper extends Wrapper {
    node: Text;
    data: string;
    skip: boolean;
    var: Identifier;
    constructor(renderer: Renderer, block: Block, parent: Wrapper, node: Text, data: string);
    use_space(): boolean;
    render(block: Block, parent_node: Identifier, parent_nodes: Identifier): void;
}
