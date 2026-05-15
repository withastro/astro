export type MarkdownImagePath = {
	raw: string;
	safeName: string;
};
export declare function getMarkdownCodeForImages(
	localImagePaths: MarkdownImagePath[],
	remoteImagePaths: string[],
	html: string,
): string;
