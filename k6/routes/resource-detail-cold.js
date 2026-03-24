/**
 * Purpose: Isolate the cold public resource detail route under load.
 * Run: BASE_URL=https://krucrafts.com COLD_SLUG=basic-solar-system-flashcards k6 run k6/routes/resource-detail-cold.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://krucrafts.com';
const COLD_SLUG = __ENV.COLD_SLUG || 'basic-solar-system-flashcards';
const ROUTE_TAG = 'resource_detail_cold';

export const options = {
  scenarios: {
    resource_detail_cold: {
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
    http_req_duration: ['p(95)<2500'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/resources/${COLD_SLUG}`, {
    tags: { route: ROUTE_TAG },
  });

  check(response, {
    'resource detail cold returns 200': (res) => res.status === 200,
  });

  sleep(1);
}
