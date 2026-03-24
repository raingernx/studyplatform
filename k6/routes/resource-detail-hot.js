/**
 * Purpose: Isolate the hot public resource detail route under load.
 * Run: BASE_URL=https://krucrafts.com HOT_SLUG=middle-school-science-quiz-assessment-set k6 run k6/routes/resource-detail-hot.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://krucrafts.com';
const HOT_SLUG = __ENV.HOT_SLUG || 'middle-school-science-quiz-assessment-set';
const ROUTE_TAG = 'resource_detail_hot';

export const options = {
  scenarios: {
    resource_detail_hot: {
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
  const response = http.get(`${BASE_URL}/resources/${HOT_SLUG}`, {
    tags: { route: ROUTE_TAG },
  });

  check(response, {
    'resource detail hot returns 200': (res) => res.status === 200,
  });

  sleep(1);
}
