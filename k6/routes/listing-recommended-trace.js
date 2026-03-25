/**
 * Purpose: Lightweight local trace run for the listing-mode recommended route.
 * Run: BASE_URL=http://localhost:3000 k6 run k6/routes/listing-recommended-trace.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ROUTE_TAG = 'listing_recommended_experiment';
const COOKIE_NAME = __ENV.RANKING_EXPERIMENT_COOKIE_NAME || 'ranking_variant';
const RECOMMENDED_VARIANT = __ENV.RANKING_RECOMMENDED_VARIANT || 'B';

export const options = {
  scenarios: {
    listing_recommended_trace: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 1 },
        { duration: '20s', target: 3 },
        { duration: '10s', target: 5 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/resources?category=all&sort=recommended`, {
    headers: {
      Cookie: `${COOKIE_NAME}=${RECOMMENDED_VARIANT}`,
    },
    tags: { route: ROUTE_TAG },
  });

  check(response, {
    'listing recommended trace returns 200': (res) => res.status === 200,
  });

  sleep(1);
}
