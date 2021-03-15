import MagicString from 'magic-string';
import Selector from './Selector';
import Element from '../nodes/Element';
import { Ast, CssHashGetter } from '../../interfaces';
import Component from '../Component';
import { CssNode } from './interfaces';
declare class Rule {
    selectors: Selector[];
    declarations: Declaration[];
    node: CssNode;
    parent: Atrule;
    constructor(node: CssNode, stylesheet: any, parent?: Atrule);
    apply(node: Element): void;
    is_used(dev: boolean): boolean;
    minify(code: MagicString, _dev: boolean): void;
    transform(code: MagicString, id: string, keyframes: Map<string, string>, max_amount_class_specificity_increased: number): boolean;
    validate(component: Component): void;
    warn_on_unused_selector(handler: (selector: Selector) => void): void;
    get_max_amount_class_specificity_increased(): number;
}
declare class Declaration {
    node: CssNode;
    constructor(node: CssNode);
    transform(code: MagicString, keyframes: Map<string, string>): void;
    minify(code: MagicString): void;
}
declare class Atrule {
    node: CssNode;
    children: Array<Atrule | Rule>;
    declarations: Declaration[];
    constructor(node: CssNode);
    apply(node: Element): void;
    is_used(_dev: boolean): boolean;
    minify(code: MagicString, dev: boolean): void;
    transform(code: MagicString, id: string, keyframes: Map<string, string>, max_amount_class_specificity_increased: number): void;
    validate(component: Component): void;
    warn_on_unused_selector(handler: (selector: Selector) => void): void;
    get_max_amount_class_specificity_increased(): any;
}
export default class Stylesheet {
    source: string;
    ast: Ast;
    filename: string;
    dev: boolean;
    has_styles: boolean;
    id: string;
    children: Array<Rule | Atrule>;
    keyframes: Map<string, string>;
    nodes_with_css_class: Set<CssNode>;
    constructor({ source, ast, component_name, filename, dev, get_css_hash }: {
        source: string;
        ast: Ast;
        filename: string | undefined;
        component_name: string | undefined;
        dev: boolean;
        get_css_hash: CssHashGetter;
    });
    apply(node: Element): void;
    reify(): void;
    render(file: string, should_transform_selectors: boolean): {
        code: string;
        map: import("magic-string").SourceMap;
    };
    validate(component: Component): void;
    warn_on_unused_selectors(component: Component): void;
}
export {};
