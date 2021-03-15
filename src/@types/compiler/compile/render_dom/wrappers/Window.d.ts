import Renderer from '../Renderer';
import Block from '../Block';
import Wrapper from './shared/Wrapper';
import Window from '../../nodes/Window';
import { Identifier } from 'estree';
import { TemplateNode } from '../../../interfaces';
import EventHandler from './Element/EventHandler';
export default class WindowWrapper extends Wrapper {
    node: Window;
    handlers: EventHandler[];
    constructor(renderer: Renderer, block: Block, parent: Wrapper, node: TemplateNode);
    render(block: Block, _parent_node: Identifier, _parent_nodes: Identifier): void;
}
