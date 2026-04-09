/**
 * Purpose: Lightweight CI sentinel for the marketplace search listing route.
 * Run: BASE_URL=https://krukraft.com QUERY=worksheet k6 run k6/routes/resources-search-smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://krukraft.com';
const QUERY = __ENV.QUERY || 'worksheet';
const ROUTE_TAG = 'resources_search_sentinel';

export const options = {
  scenarios: {
    resources_search_sentinel: {
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
    http_req_duration: ['p(95)<1200'],
  },
};

export default function () {
  const response = http.get(
    `${BASE_URL}/resources?q=${encodeURIComponent(QUERY)}&search=${encodeURIComponent(QUERY)}`,
    {
      tags: { route: ROUTE_TAG },
    },
  );

  check(response, {
    'resources search sentinel returns 200': (res) => res.status === 200,
  });

  sleep(1);
}
