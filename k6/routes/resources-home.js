/**
 * Purpose: Isolate the public /resources homepage under load.
 * Run: BASE_URL=https://krucrafts.com k6 run k6/routes/resources-home.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://krucrafts.com';
const ROUTE_TAG = 'resources_home';

export const options = {
  scenarios: {
    resources_home: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 25 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/resources`, {
    tags: { route: ROUTE_TAG },
  });

  check(response, {
    'resources home returns 200': (res) => res.status === 200,
  });

  sleep(1);
}
