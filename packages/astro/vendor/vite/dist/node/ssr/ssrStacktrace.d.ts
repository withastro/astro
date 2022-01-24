import { ModuleGraph } from '../server/moduleGraph';
export declare function ssrRewriteStacktrace(stack: string, moduleGraph: ModuleGraph): string;
export declare function rebindErrorStacktrace(e: Error, stacktrace: string): void;
