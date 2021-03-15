export declare function string_literal(data: string): {
    type: string;
    value: string;
};
export declare function escape(data: string, { only_escape_at_symbol }?: {
    only_escape_at_symbol?: boolean;
}): string;
export declare function escape_html(html: any): string;
export declare function escape_template(str: any): any;
