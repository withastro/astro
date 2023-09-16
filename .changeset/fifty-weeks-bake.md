---
'@astrojs/cloudflare': minor
---

Add support for the following Node.js Runtime APIs, which are availabe in [Cloudflare](https://developers.cloudflare.com/workers/runtime-apis/nodejs) using the `node:` syntax.

- assert
- AsyncLocalStorage
- Buffer
- Diagnostics Channel
- EventEmitter
- path
- process
- Streams
- StringDecoder
- util

```js
import { Buffer } from 'node:buffer';
```
