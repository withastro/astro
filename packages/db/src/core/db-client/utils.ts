import type { Config as LibSQLConfig } from '@libsql/client';
import z from 'zod';

const rawLibSQLOptions = z.record(z.string());

const parseNumber = (value: string) => z.coerce.number().parse(value);
const parseBoolean = (value: string) => z.coerce.boolean().parse(value);

const libSQLConfigTransformed = rawLibSQLOptions.transform((raw) => {
    // Ensure the URL is always present
	const parsed: LibSQLConfig = {
		url: raw.url,
	};

    // Optional fields
	for (const [key, value] of Object.entries(raw)) {
		switch (key) {
			case 'syncInterval':
			case 'concurrency':
				parsed[key] = parseNumber(value);
				break;
			case 'readYourWrites':
			case 'offline':
			case 'tls':
				parsed[key] = parseBoolean(value);
				break;
            case 'authToken':
            case 'encryptionKey':
            case 'syncUrl':
				parsed[key] = value;
				break;
            case 'url':
                // Already handled above, no need to reassign
                break;
            default:
                throw new Error(`Unsupported LibSQL config option: ${key}`);
		}
	}

    // Return the parsed config
    return parsed;
});

export const parseLibSQLConfig = (config: Record<string, string>): LibSQLConfig => {
    try {
        return libSQLConfigTransformed.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(`Invalid LibSQL config: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
    }
}