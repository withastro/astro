export declare class CompileError extends Error {
    code: string;
    start: {
        line: number;
        column: number;
    };
    end: {
        line: number;
        column: number;
    };
    pos: number;
    filename: string;
    frame: string;
    toString(): string;
}
/** Throw CompileError */
export default function error(message: string, props: {
    name: string;
    code: string;
    source: string;
    filename: string;
    start: number;
    end?: number;
}): never;
