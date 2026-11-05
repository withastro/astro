/// <reference types="astro/client" />
import { createClient } from '@libsql/client';
import type { CollectionStorageDriverFactory } from 'astro';
import { getSecret } from 'astro:env/server';
import { createSqliteDriver } from './create-driver.js';

const createDriver: CollectionStorageDriverFactory = (config) =>
	createSqliteDriver(createClient, config, getSecret);

export default createDriver;
