import Renderer from '../../Renderer';
import Block from '../../Block';
import { TemplateNode } from '../../../../interfaces';
import { Identifier } from 'estree';
export default class Wrapper {
    renderer: Renderer;
    parent: Wrapper;
    node: TemplateNode;
    prev: Wrapper | null;
    next: Wrapper | null;
    var: Identifier;
    can_use_innerhtml: boolean;
    is_static_content: boolean;
    constructor(renderer: Renderer, block: Block, parent: Wrapper, node: TemplateNode);
    cannot_use_innerhtml(): void;
    not_static_content(): void;
    get_or_create_anchor(block: Block, parent_node: Identifier, parent_nodes: Identifier): Identifier;
    get_update_mount_node(anchor: Identifier): Identifier;
    is_dom_node(): boolean;
    render(_block: Block, _parent_node: Identifier, _parent_nodes: Identifier): void;
}
