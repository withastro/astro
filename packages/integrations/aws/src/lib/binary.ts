const commonBinaryMimeTypes = new Set([
	"application/octet-stream",
	// Docs
	"application/epub+zip",
	"application/msword",
	"application/pdf",
	"application/rtf",
	"application/vnd.amazon.ebook",
	"application/vnd.ms-excel",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	// Fonts
	"font/otf",
	"font/woff",
	"font/woff2",
	// Images
	"image/bmp",
	"image/gif",
	"image/jpeg",
	"image/png",
	"image/tiff",
	"image/vnd.microsoft.icon",
	"image/webp",
	// Audio
	"audio/3gpp",
	"audio/aac",
	"audio/basic",
	"audio/mpeg",
	"audio/ogg",
	"audio/wavaudio/webm",
	"audio/x-aiff",
	"audio/x-midi",
	"audio/x-wav",
	// Video
	"video/3gpp",
	"video/mp2t",
	"video/mpeg",
	"video/ogg",
	"video/quicktime",
	"video/webm",
	"video/x-msvideo",
	// Archives
	"application/java-archive",
	"application/vnd.apple.installer+xml",
	"application/x-7z-compressed",
	"application/x-apple-diskimage",
	"application/x-bzip",
	"application/x-bzip2",
	"application/x-gzip",
	"application/x-java-archive",
	"application/x-rar-compressed",
	"application/x-tar",
	"application/x-zip",
	"application/zip",
]);

export function isBinaryContentType(contentType?: string | null) {
	if (!contentType) return false;

	const value = contentType?.split(';')[0] ?? '';
	return commonBinaryMimeTypes.has(value);
}