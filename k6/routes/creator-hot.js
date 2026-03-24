/**
 * Purpose: Isolate the hot public creator route under load.
 * Run: BASE_URL=https://krucrafts.com HOT_CREATOR=kru-mint k6 run k6/routes/creator-hot.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://krucrafts.com';
const HOT_CREATOR = __ENV.HOT_CREATOR || 'kru-mint';
const ROUTE_TAG = 'creator_hot';

export const options = {
  scenarios: {
    creator_hot: {
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
  const response = http.get(`${BASE_URL}/creators/${HOT_CREATOR}`, {
    tags: { route: ROUTE_TAG },
  });

  check(response, {
    'creator hot returns 200': (res) => res.status === 200,
  });

  sleep(1);
}
