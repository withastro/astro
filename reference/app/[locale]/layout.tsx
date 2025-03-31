'use client';

import { use } from 'react';

export default function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params);
  return children;
} 