export interface AssertOptions {
    assert?: {
        type: string;
    };
}
export declare function transformImportGlob(source: string, pos: number, importer: string, importIndex: number, root: string, normalizeUrl?: (url: string, pos: number) => Promise<[string, string]>, preload?: boolean): Promise<{
    importsString: string;
    imports: string[];
    exp: string;
    endIndex: number;
    isEager: boolean;
    pattern: string;
    base: string;
}>;
