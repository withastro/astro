/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { SourceMap } from 'rollup';
export declare function send(req: IncomingMessage, res: ServerResponse, content: string | Buffer, type: string, etag?: string, cacheControl?: string, map?: SourceMap | null): void;
