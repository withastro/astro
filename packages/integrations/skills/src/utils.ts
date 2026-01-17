import { extname } from 'node:path';

/**
 * Regex for validating skill names per the Agent Skills RFC:
 * - 1-64 characters
 * - Lowercase alphanumeric and hyphens only (a-z, 0-9, -)
 * - Must not start or end with a hyphen
 * - Must not contain consecutive hyphens
 */
const SKILL_NAME_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Validates a skill name against the Agent Skills RFC specification.
 *
 * Rules:
 * - 1-64 characters
 * - Lowercase alphanumeric and hyphens only (a-z, 0-9, -)
 * - Must not start or end with a hyphen
 * - Must not contain consecutive hyphens
 */
export function isValidSkillName(name: string): boolean {
	if (name.length < 1 || name.length > 64) {
		return false;
	}
	if (!SKILL_NAME_REGEX.test(name)) {
		return false;
	}
	if (name.includes('--')) {
		return false;
	}
	return true;
}

/**
 * Returns validation error message for an invalid skill name, or null if valid.
 */
export function getSkillNameValidationError(name: string): string | null {
	if (name.length < 1) {
		return 'Skill name cannot be empty';
	}
	if (name.length > 64) {
		return `Skill name must be 64 characters or less (got ${name.length})`;
	}
	if (name.startsWith('-')) {
		return 'Skill name cannot start with a hyphen';
	}
	if (name.endsWith('-')) {
		return 'Skill name cannot end with a hyphen';
	}
	if (name.includes('--')) {
		return 'Skill name cannot contain consecutive hyphens';
	}
	if (!/^[a-z0-9-]+$/.test(name)) {
		return 'Skill name can only contain lowercase letters, numbers, and hyphens';
	}
	return null;
}

/**
 * MIME types for common file extensions
 */
const MIME_TYPES: Record<string, string> = {
	// Markdown
	'.md': 'text/markdown',
	'.markdown': 'text/markdown',

	// Code
	'.py': 'text/x-python',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.ts': 'text/typescript',
	'.mts': 'text/typescript',
	'.jsx': 'text/jsx',
	'.tsx': 'text/tsx',
	'.sh': 'text/x-shellscript',
	'.bash': 'text/x-shellscript',
	'.zsh': 'text/x-shellscript',
	'.rb': 'text/x-ruby',
	'.go': 'text/x-go',
	'.rs': 'text/x-rust',
	'.java': 'text/x-java',
	'.c': 'text/x-c',
	'.cpp': 'text/x-c++',
	'.h': 'text/x-c',
	'.hpp': 'text/x-c++',
	'.cs': 'text/x-csharp',
	'.php': 'text/x-php',
	'.swift': 'text/x-swift',
	'.kt': 'text/x-kotlin',
	'.scala': 'text/x-scala',
	'.r': 'text/x-r',
	'.sql': 'text/x-sql',

	// Data formats
	'.json': 'application/json',
	'.yaml': 'text/yaml',
	'.yml': 'text/yaml',
	'.toml': 'text/toml',
	'.xml': 'application/xml',
	'.csv': 'text/csv',

	// Text
	'.txt': 'text/plain',
	'.log': 'text/plain',
	'.cfg': 'text/plain',
	'.conf': 'text/plain',
	'.ini': 'text/plain',
	'.env': 'text/plain',

	// Web
	'.html': 'text/html',
	'.htm': 'text/html',
	'.css': 'text/css',

	// Images
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.bmp': 'image/bmp',
	'.tiff': 'image/tiff',
	'.tif': 'image/tiff',

	// Documents
	'.pdf': 'application/pdf',
	'.doc': 'application/msword',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.xls': 'application/vnd.ms-excel',
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

	// Archives
	'.zip': 'application/zip',
	'.tar': 'application/x-tar',
	'.gz': 'application/gzip',
	'.rar': 'application/vnd.rar',
	'.7z': 'application/x-7z-compressed',

	// Other
	'.wasm': 'application/wasm',
};

/**
 * Binary file extensions that should be base64-encoded
 */
const BINARY_EXTENSIONS = new Set([
	// Images
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.webp',
	'.ico',
	'.bmp',
	'.tiff',
	'.tif',

	// Documents
	'.pdf',
	'.doc',
	'.docx',
	'.xls',
	'.xlsx',
	'.ppt',
	'.pptx',

	// Archives
	'.zip',
	'.tar',
	'.gz',
	'.rar',
	'.7z',
	'.bz2',

	// Other binary
	'.wasm',
	'.exe',
	'.dll',
	'.so',
	'.dylib',
	'.bin',
]);

/**
 * Gets the MIME type for a file based on its extension.
 */
export function getMimeType(filePath: string): string {
	const ext = extname(filePath).toLowerCase();
	return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Determines if a file should be treated as binary (and base64-encoded).
 */
export function isBinaryFile(filePath: string): boolean {
	const ext = extname(filePath).toLowerCase();
	return BINARY_EXTENSIONS.has(ext);
}

/**
 * Converts a file path to use forward slashes (for consistent storage keys)
 */
export function normalizeFilePath(filePath: string): string {
	return filePath.replace(/\\/g, '/');
}
