/**
 * Purpose: Lightweight CI smoke check for the newest/control listing route.
 * Run: BASE_URL=https://krucrafts.com k6 run k6/routes/listing-newest-smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://krucrafts.com';
const ROUTE_TAG = 'listing_newest_control';
const COOKIE_NAME = __ENV.RANKING_EXPERIMENT_COOKIE_NAME || 'ranking_variant';
const CONTROL_VARIANT = __ENV.RANKING_CONTROL_VARIANT || 'A';

export const options = {
  scenarios: {
    listing_newest_smoke: {
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
  const response = http.get(`${BASE_URL}/resources?category=all&sort=newest`, {
    headers: {
      Cookie: `${COOKIE_NAME}=${CONTROL_VARIANT}`,
    },
    tags: { route: ROUTE_TAG },
  });

  check(response, {
    'listing newest smoke returns 200': (res) => res.status === 200,
  });

  sleep(1);
}
