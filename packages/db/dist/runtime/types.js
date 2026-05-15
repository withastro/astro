const SERIALIZED_SQL_KEY = '__serializedSQL';
function isSerializedSQL(value) {
	return typeof value === 'object' && value !== null && SERIALIZED_SQL_KEY in value;
}
export { SERIALIZED_SQL_KEY, isSerializedSQL };
