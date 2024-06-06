/// <reference types="astro/client" />

import type { AnalyticsProps } from '@vercel/analytics';

export type VercelWebAnalyticsBeforeSend = AnalyticsProps['beforeSend'];
