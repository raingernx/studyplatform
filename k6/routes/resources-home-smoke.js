/**
 * Purpose: Lightweight CI smoke check for the public /resources homepage.
 * Run: BASE_URL=https://krucrafts.com k6 run k6/routes/resources-home-smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://krucrafts.com';
const ROUTE_TAG = 'resources_home';

export const options = {
  scenarios: {
    resources_home_smoke: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 1 },
        { duration: '10s', target: 3 },
        { duration: '10s', target: 5 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/resources`, {
    tags: { route: ROUTE_TAG },
  });

  check(response, {
    'resources home smoke returns 200': (res) => res.status === 200,
  });

  sleep(1);
}
