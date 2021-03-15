import { AppendTarget, CompileOptions } from '../../interfaces';
import { INode } from '../nodes/interfaces';
import { Expression, TemplateLiteral, Identifier } from 'estree';
export interface RenderOptions extends CompileOptions {
    locate: (c: number) => {
        line: number;
        column: number;
    };
    head_id?: string;
}
export default class Renderer {
    has_bindings: boolean;
    name: Identifier;
    stack: Array<{
        current: {
            value: string;
        };
        literal: TemplateLiteral;
    }>;
    current: {
        value: string;
    };
    literal: TemplateLiteral;
    targets: AppendTarget[];
    constructor({ name }: {
        name: any;
    });
    add_string(str: string): void;
    add_expression(node: Expression): void;
    push(): void;
    pop(): TemplateLiteral;
    render(nodes: INode[], options: RenderOptions): void;
}
