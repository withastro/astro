import { manifest } from 'virtual:astro:manifest';
import { NodeApp } from '../../node.js';
import type { CreateNodeApp } from '../../types.js';

export const createNodeApp: CreateNodeApp = (streaming) => new NodeApp(manifest, streaming);
