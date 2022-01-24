import { RollupError } from 'rollup';
import { ViteDevServer } from '../..';
import { Connect } from 'types/connect';
import { ErrorPayload } from 'types/hmrPayload';
export declare function prepareError(err: Error | RollupError): ErrorPayload['err'];
export declare function buildErrorMessage(err: RollupError, args?: string[], includeStack?: boolean): string;
export declare function logError(server: ViteDevServer, err: RollupError): void;
export declare function errorMiddleware(server: ViteDevServer, allowNext?: boolean): Connect.ErrorHandleFunction;
