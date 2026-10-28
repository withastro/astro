import { handle } from '@astrojs/cloudflare/handler';
import { DurableObject } from 'cloudflare:workers';

export class ExampleDO extends DurableObject {}

export default { fetch: handle };
