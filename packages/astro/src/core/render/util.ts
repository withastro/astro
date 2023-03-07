/**
 * Verify that the endpoint is a legal name when it has getStaticPaths
 *
 */
export function validateEndpointFileExt(pathname: string) {
	return pathname.endsWith('js') || pathname.endsWith('ts');
}
