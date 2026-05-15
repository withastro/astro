export declare function loadRemoteImage(src: URL): Promise<Buffer | undefined>;
export declare const handleImageRequest: ({
	request,
	loadLocalImage,
}: {
	request: Request;
	loadLocalImage: (src: string, baseUrl: URL) => Promise<Buffer | undefined>;
}) => Promise<Response>;
