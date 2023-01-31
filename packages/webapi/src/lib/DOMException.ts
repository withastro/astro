import * as _ from './utils'

export class DOMException extends Error {
	constructor(message = '', name = 'Error') {
		super(message)

		this.code = 0
		this.name = name
	}

	code!: number

	static INDEX_SIZE_ERR = 1
	static DOMSTRING_SIZE_ERR = 2
	static HIERARCHY_REQUEST_ERR = 3
	static WRONG_DOCUMENT_ERR = 4
	static INVALID_CHARACTER_ERR = 5
	static NO_DATA_ALLOWED_ERR = 6
	static NO_MODIFICATION_ALLOWED_ERR = 7
	static NOT_FOUND_ERR = 8
	static NOT_SUPPORTED_ERR = 9
	static INUSE_ATTRIBUTE_ERR = 10
	static INVALID_STATE_ERR = 11
	static SYNTAX_ERR = 12
	static INVALID_MODIFICATION_ERR = 13
	static NAMESPACE_ERR = 14
	static INVALID_ACCESS_ERR = 15
	static VALIDATION_ERR = 16
	static TYPE_MISMATCH_ERR = 17
	static SECURITY_ERR = 18
	static NETWORK_ERR = 19
	static ABORT_ERR = 20
	static URL_MISMATCH_ERR = 21
	static QUOTA_EXCEEDED_ERR = 22
	static TIMEOUT_ERR = 23
	static INVALID_NODE_TYPE_ERR = 24
	static DATA_CLONE_ERR = 25
}

_.allowStringTag(DOMException)
