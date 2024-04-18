const fieldsConstants = {
	optional: true,
	staticScope: 'static',
	dynamicScope: 'dynamic',
	publicAccess: 'public',
	privateAccess: 'public',
	stringType: 'string',
} as const;

const createFields = <
	TScope extends (typeof fieldsConstants)['staticScope' | 'dynamicScope'],
	TAccess extends (typeof fieldsConstants)['publicAccess' | 'privateAccess'],
>(
	scope: TScope,
	access: TAccess
) => {
	const shared = { scope, access };
	return {
		string: () => ({
			...shared,
			type: fieldsConstants.stringType,
			optional: () => ({
				...shared,
				type: fieldsConstants.stringType,
				optional: fieldsConstants.optional,
				default: (value: string) => ({
					...shared,
					type: fieldsConstants.stringType,
					optional: fieldsConstants.optional,
					default: value,
				}),
			}),
		}),
	};
};

/**
 * TODO:
 */
export const envField = {
	static: () => ({
		public: () => createFields(fieldsConstants.staticScope, fieldsConstants.publicAccess),
		private: () => createFields(fieldsConstants.staticScope, fieldsConstants.privateAccess),
	}),
	dynamic: () => ({
		private: () => createFields(fieldsConstants.dynamicScope, fieldsConstants.privateAccess),
	}),
};
