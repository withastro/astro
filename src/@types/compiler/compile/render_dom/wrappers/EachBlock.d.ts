import Renderer from '../Renderer';
import Block from '../Block';
import Wrapper from './shared/Wrapper';
import EachBlock from '../../nodes/EachBlock';
import FragmentWrapper from './Fragment';
import ElseBlock from '../../nodes/ElseBlock';
import { Identifier, Node } from 'estree';
export declare class ElseBlockWrapper extends Wrapper {
    node: ElseBlock;
    block: Block;
    fragment: FragmentWrapper;
    is_dynamic: boolean;
    var: any;
    constructor(renderer: Renderer, block: Block, parent: Wrapper, node: ElseBlock, strip_whitespace: boolean, next_sibling: Wrapper);
}
export default class EachBlockWrapper extends Wrapper {
    block: Block;
    node: EachBlock;
    fragment: FragmentWrapper;
    else?: ElseBlockWrapper;
    vars: {
        create_each_block: Identifier;
        each_block_value: Identifier;
        get_each_context: Identifier;
        iterations: Identifier;
        fixed_length: number;
        data_length: Node | number;
        view_length: Node | number;
    };
    context_props: Array<Node | Node[]>;
    index_name: Identifier;
    updates: Array<Node | Node[]>;
    dependencies: Set<string>;
    var: Identifier;
    constructor(renderer: Renderer, block: Block, parent: Wrapper, node: EachBlock, strip_whitespace: boolean, next_sibling: Wrapper);
    render(block: Block, parent_node: Identifier, parent_nodes: Identifier): void;
    render_keyed({ block, parent_node, parent_nodes, snippet, initial_anchor_node, initial_mount_node, update_anchor_node, update_mount_node }: {
        block: Block;
        parent_node: Identifier;
        parent_nodes: Identifier;
        snippet: Node;
        initial_anchor_node: Identifier;
        initial_mount_node: Identifier;
        update_anchor_node: Identifier;
        update_mount_node: Identifier;
    }): void;
    render_unkeyed({ block, parent_nodes, snippet, initial_anchor_node, initial_mount_node, update_anchor_node, update_mount_node }: {
        block: Block;
        parent_nodes: Identifier;
        snippet: Node;
        initial_anchor_node: Identifier;
        initial_mount_node: Identifier;
        update_anchor_node: Identifier;
        update_mount_node: Identifier;
    }): void;
}
