import { leakDetectionMiddleware } from 'astro/env/middleware'

export const onRequest = leakDetectionMiddleware()
