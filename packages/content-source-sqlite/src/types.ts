import { z } from 'zod';

const contentStorageConfigSchema = z.object({
	url: z.string().min(1, 'SQLite content storage requires a database URL.'),
	token: z.string().optional(),
});

export type ContentStorageConfig = z.infer<typeof contentStorageConfigSchema>;

export function parseConfig(config: unknown): ContentStorageConfig {
	return contentStorageConfigSchema.parse(config);
}
