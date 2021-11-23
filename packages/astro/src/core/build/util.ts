import type { Response, RequestInit } from 'node-fetch';
import fetch from 'node-fetch';

export type ViteFetch = (pathname: string, init?: RequestInit) => Promise<Response>;

function localizedFetch(origin: string, pathname: string, init?: RequestInit) {
  const url = origin + pathname;
  return fetch(url, init);
}

export function createFetch(origin: string): ViteFetch {
  return localizedFetch.bind(null, origin);
}