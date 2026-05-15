import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { invalidVariablesToError } from './errors.js';
import { getEnvFieldType, validateEnvVariable } from './validators.js';
let _getEnv = (key) => process.env[key];
function setGetEnv(fn) {
	_getEnv = fn;
	_onSetGetEnv();
}
let _onSetGetEnv = () => {};
function setOnSetGetEnv(fn) {
	_onSetGetEnv = fn;
}
function getEnv(...args) {
	return _getEnv(...args);
}
function createInvalidVariablesError(key, type, result) {
	return new AstroError({
		...AstroErrorData.EnvInvalidVariables,
		message: AstroErrorData.EnvInvalidVariables.message(
			invalidVariablesToError([{ key, type, errors: result.errors }]),
		),
	});
}
export {
	createInvalidVariablesError,
	getEnv,
	getEnvFieldType,
	setGetEnv,
	setOnSetGetEnv,
	validateEnvVariable,
};
