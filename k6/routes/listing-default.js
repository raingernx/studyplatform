/**
 * Purpose: Isolate the public listing-mode default route under load.
 * Run: BASE_URL=https://krucrafts.com k6 run k6/routes/listing-default.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://krucrafts.com';
const ROUTE_TAG = 'listing_default';

export const options = {
  scenarios: {
    listing_default: {
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
  const response = http.get(`${BASE_URL}/resources?category=all`, {
    tags: { route: ROUTE_TAG },
  });

  check(response, {
    'listing default returns 200': (res) => res.status === 200,
  });

  sleep(1);
}
