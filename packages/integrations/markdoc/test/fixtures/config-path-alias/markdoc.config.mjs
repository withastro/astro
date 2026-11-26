import { sep } from 'node:path';
import { document } from '~/markdoc/nodes.js';

export default {
	nodes: { document },
	variables: { sep },
};
