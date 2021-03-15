import Block from '../Block';
import Wrapper from './shared/Wrapper';
import Body from '../../nodes/Body';
import { Identifier } from 'estree';
import EventHandler from './Element/EventHandler';
import { TemplateNode } from '../../../interfaces';
import Renderer from '../Renderer';
export default class BodyWrapper extends Wrapper {
    node: Body;
    handlers: EventHandler[];
    constructor(renderer: Renderer, block: Block, parent: Wrapper, node: TemplateNode);
    render(block: Block, _parent_node: Identifier, _parent_nodes: Identifier): void;
}
