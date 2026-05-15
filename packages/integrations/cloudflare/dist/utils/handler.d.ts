export interface Runtime {
	cfContext: ExecutionContext;
}
declare global {
	var __ASTRO_IMAGES_BINDING_NAME: string;
}
type CfResponse = Awaited<ReturnType<Required<ExportedHandler<Env>>['fetch']>>;
export declare function handle(
	request: Request,
	env: Env,
	context: ExecutionContext,
): Promise<CfResponse>;
export {};
