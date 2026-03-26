/**
 * Purpose: Lightweight CI smoke check for the hot public resource detail route.
 * Run: BASE_URL=https://krucrafts.com HOT_SLUG=middle-school-science-quiz-assessment-set k6 run k6/routes/resource-detail-smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://krucrafts.com';
const HOT_SLUG = __ENV.HOT_SLUG || 'middle-school-science-quiz-assessment-set';
const ROUTE_TAG = 'resource_detail_hot';

export const options = {
  scenarios: {
    resource_detail_smoke: {
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
    http_req_duration: ['p(95)<600'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/resources/${HOT_SLUG}`, {
    tags: { route: ROUTE_TAG },
  });

  check(response, {
    'resource detail smoke returns 200': (res) => res.status === 200,
  });

  sleep(1);
}
