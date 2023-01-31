import { deserialize } from '@ungap/structured-clone/esm/deserialize.js'
import { serialize } from '@ungap/structured-clone/esm/serialize.js'

export default (any: any, options: any) => deserialize(serialize(any, options))
