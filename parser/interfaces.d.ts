import type { SourceMap } from 'magic-string';
export interface BaseNode {
    start: number;
    end: number;
    type: string;
    children?: TemplateNode[];
    [prop_name: string]: any;
}
export interface Fragment extends BaseNode {
    type: 'Fragment';
    children: TemplateNode[];
}
export interface Text extends BaseNode {
    type: 'Text';
    data: string;
    raw: string;
}
export interface Attribute extends BaseNode {
    type: 'Attribute';
    name: string;
    value: Text[];
}
export interface MustacheTag extends BaseNode {
    type: 'MustacheTag';
    content: string;
}
export declare type DirectiveType = 'Action' | 'Animation' | 'Binding' | 'Class' | 'EventHandler' | 'Let' | 'Ref' | 'Transition';
interface BaseDirective extends BaseNode {
    type: DirectiveType;
    expression: null | Node;
    name: string;
    modifiers: string[];
}
export interface Transition extends BaseDirective {
    type: 'Transition';
    intro: boolean;
    outro: boolean;
}
export declare type Directive = BaseDirective | Transition;
export declare type TemplateNode = Text | MustacheTag | BaseNode | Directive | Transition;
export interface Expression {
    type: 'Expression';
    start: number;
    end: number;
    codeStart: string;
    codeEnd: string;
    children: BaseNode[];
}
export interface Parser {
    readonly template: string;
    readonly filename?: string;
    index: number;
    stack: Node[];
    html: Node;
    css: Node;
    js: Node;
    meta_tags: Map<string, string>;
}
export interface Script extends BaseNode {
    type: 'Script';
    context: 'runtime' | 'setup';
    content: string;
}
export interface Style extends BaseNode {
    type: 'Style';
    attributes: any[];
    content: {
        start: number;
        end: number;
        styles: string;
    };
}
export interface Ast {
    html: TemplateNode;
    css: Style;
    module: Script;
}
export interface Warning {
    start?: {
        line: number;
        column: number;
        pos?: number;
    };
    end?: {
        line: number;
        column: number;
    };
    pos?: number;
    code: string;
    message: string;
    filename?: string;
    frame?: string;
    toString: () => string;
}
export declare type ModuleFormat = 'esm' | 'cjs';
export declare type CssHashGetter = (args: {
    name: string;
    filename: string | undefined;
    css: string;
    hash: (input: string) => string;
}) => string;
export interface Visitor {
    enter: (node: Node) => void;
    leave?: (node: Node) => void;
}
export interface AppendTarget {
    slots: Record<string, string>;
    slot_stack: string[];
}
export interface Var {
    name: string;
    export_name?: string;
    injected?: boolean;
    module?: boolean;
    mutated?: boolean;
    reassigned?: boolean;
    referenced?: boolean;
    referenced_from_script?: boolean;
    writable?: boolean;
    global?: boolean;
    internal?: boolean;
    initialised?: boolean;
    hoistable?: boolean;
    subscribable?: boolean;
    is_reactive_dependency?: boolean;
    imported?: boolean;
}
export interface CssResult {
    code: string;
    map: SourceMap;
}
export {};
