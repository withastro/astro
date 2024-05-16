import { getAstroStudioUrl } from "@astrojs/studio";

export function getAstroStudioStorageUrl(): string {
	return getAstroStudioUrl() + '/api/cli/files.list';
}
