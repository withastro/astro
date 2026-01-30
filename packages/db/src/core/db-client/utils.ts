import type { Config as LibSQLConfig } from '@libsql/client';
import z from 'zod';

const rawLibSQLOptions = z.record(z.string());

const parseNumber = (value: string) => z.coerce.number().parse(value);
const parseBoolean = (value: string) => z.coerce.boolean().parse(value);

const booleanValues = ['true', 'false'];

// parse a value that should be a boolean, but could be a valueless variable:
// e.g. 'file://local-copy.db?readYourWrites' & 'file://local-copy.db?readYourWrites=true' should be parsed as true
const parseOptionalBoolean = (value: string) => {
	if (booleanValues.includes(value)) {
		return parseBoolean(value);
	}
	return true; // If the value is not explicitly 'true' or 'false', assume it's true (valueless variable)
};

const libSQLConfigTransformed = rawLibSQLOptions.transform((raw) => {
	// Ensure the URL is always present
	const parsed: Partial<LibSQLConfig> = {};

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
				parsed[key] = parseOptionalBoolean(value);
				break;
			case 'authToken':
			case 'encryptionKey':
			case 'syncUrl':
				parsed[key] = value;
				break;
		}
	}

	// Return the parsed config
	return parsed;
});

export const parseLibSQLConfig = (config: Record<string, string>): Partial<LibSQLConfig> => {
	try {
		return libSQLConfigTransformed.parse(config);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(`Invalid LibSQL config: ${error.errors.map((e) => e.message).join(', ')}`);
		}
		throw error;
	}
};
