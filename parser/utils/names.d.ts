export declare const globals: Set<string>;
export declare const reserved: Set<string>;
/** Is this a void HTML element? */
export declare function is_void(name: string): boolean;
/** Is this a valid HTML element? */
export declare function is_valid(str: string): boolean;
/** Utility to normalize HTML */
export declare function sanitize(name: string): string;
