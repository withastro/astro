//
// to run:
//   cat loadtest.js | docker run --rm -i --add-host=xenforo.local.svc.cluster.local:host-gateway grafana/k6:latest run --vus=10 --duration=30s -
//

import { check } from 'k6';
import http from 'k6/http';

export const options = {
  insecureSkipTLSVerify: true
};

const url = __ENV.URL;

if (!url) {
  throw new Error("env-var URL not set.");
}

export function setup() {
  const params = { headers: { Host: "localhost" } }

  const res = http.get(url, params);

  if (res.status !== 200) {
    throw new Error(`Failure to warm up instance, status=${res.status}.`);
  }

  return null;
}

export default function (data) {
  const res = http.get(url);

  check(res, {
    'status is 200': (r) => r.status === 200,
		'length is 15561': (r) => r.body.length === 15561,
  });
}
