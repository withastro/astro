import { TemplateNode, Ast, ParserOptions, Fragment, Style, Script } from '../interfaces.js';
interface LastAutoClosedTag {
    tag: string;
    reason: string;
    depth: number;
}
export declare class Parser {
    readonly template: string;
    readonly filename?: string;
    readonly customElement: boolean;
    index: number;
    stack: TemplateNode[];
    html: Fragment;
    css: Style[];
    js: Script[];
    meta_tags: {};
    last_auto_closed_tag?: LastAutoClosedTag;
    constructor(template: string, options: ParserOptions);
    current(): TemplateNode;
    acorn_error(err: any): void;
    error({ code, message }: {
        code: string;
        message: string;
    }, index?: number): void;
    eat(str: string, required?: boolean, message?: string): boolean;
    match(str: string): boolean;
    match_regex(pattern: RegExp): string;
    allow_whitespace(): void;
    read(pattern: RegExp): string;
    read_identifier(allow_reserved?: boolean): string;
    read_until(pattern: RegExp): string;
    require_whitespace(): void;
}
/**
 * Parse
 * Step 1/3 in Astro SSR.
 * This is the first pass over .astro files and the step at which we convert a string to an AST for us to crawl.
 */
export default function parse(template: string, options?: ParserOptions): Ast;
export {};
