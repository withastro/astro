import type { Context } from '@netlify/functions';
export declare function createHandler({
	notFoundContent,
}: {
	notFoundContent: string | undefined;
}): (request: Request, context: Context) => Promise<Response>;
