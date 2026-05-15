type RedirectTemplate = {
	from?: string;
	absoluteLocation: string | URL;
	status: number;
	relativeLocation: string;
};
/**
 * Generates a minimal HTML redirect page used for SSR redirects.
 */
export declare function redirectTemplate({
	status,
	absoluteLocation,
	relativeLocation,
	from,
}: RedirectTemplate): string;
export {};
