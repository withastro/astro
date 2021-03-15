import Binding from '../../../nodes/Binding';
import ElementWrapper from '../Element';
import InlineComponentWrapper from '../InlineComponent';
import Block from '../../Block';
import { Node, Identifier } from 'estree';
export default class BindingWrapper {
    node: Binding;
    parent: ElementWrapper | InlineComponentWrapper;
    object: string;
    handler: {
        uses_context: boolean;
        mutation: (Node | Node[]);
        contextual_dependencies: Set<string>;
        lhs?: Node;
    };
    snippet: Node;
    is_readonly: boolean;
    needs_lock: boolean;
    constructor(block: Block, node: Binding, parent: ElementWrapper | InlineComponentWrapper);
    get_dependencies(): Set<string>;
    is_readonly_media_attribute(): boolean;
    render(block: Block, lock: Identifier): void;
}
