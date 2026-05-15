import * as z from 'zod/v4';
const rawLibSQLOptions = z.record(z.string(), z.string());
const parseNumber = (value) => z.coerce.number().parse(value);
const parseBoolean = (value) => z.coerce.boolean().parse(value);
const booleanValues = ['true', 'false'];
const parseOptionalBoolean = (value) => {
	if (booleanValues.includes(value)) {
		return parseBoolean(value);
	}
	return true;
};
const libSQLConfigTransformed = rawLibSQLOptions.transform((raw) => {
	const parsed = {};
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
	return parsed;
});
const parseLibSQLConfig = (config) => {
	try {
		return libSQLConfigTransformed.parse(config);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(`Invalid LibSQL config: ${error.issues.map((e) => e.message).join(', ')}`);
		}
		throw error;
	}
};
export { parseLibSQLConfig };
