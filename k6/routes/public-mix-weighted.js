/**
 * Purpose: Run a weighted public read-only mix to spot which KRUCraft public route family drives tail latency.
 * Run: BASE_URL=https://krucrafts.com k6 run k6/routes/public-mix-weighted.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://krucrafts.com';
const HOT_SLUG = __ENV.HOT_SLUG || 'middle-school-science-quiz-assessment-set';
const COLD_SLUG = __ENV.COLD_SLUG || 'basic-solar-system-flashcards';
const HOT_CREATOR = __ENV.HOT_CREATOR || 'kru-mint';
const COOKIE_NAME = __ENV.RANKING_EXPERIMENT_COOKIE_NAME || 'ranking_variant';
const CONTROL_VARIANT = __ENV.RANKING_CONTROL_VARIANT || 'A';
const RECOMMENDED_VARIANT = __ENV.RANKING_RECOMMENDED_VARIANT || 'B';

export const options = {
  scenarios: {
    public_mix_weighted: {
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

const routes = [
  {
    weight: 30,
    tag: 'resources_home',
    path: '/resources',
  },
  {
    weight: 15,
    tag: 'listing_default',
    path: '/resources?category=all',
  },
  {
    weight: 13,
    tag: 'listing_newest_control',
    path: '/resources?category=all&sort=newest',
    cookie: `${COOKIE_NAME}=${CONTROL_VARIANT}`,
  },
  {
    weight: 12,
    tag: 'listing_recommended_experiment',
    path: '/resources?category=all&sort=recommended',
    cookie: `${COOKIE_NAME}=${RECOMMENDED_VARIANT}`,
  },
  {
    weight: 15,
    tag: 'resource_detail_hot',
    path: `/resources/${HOT_SLUG}`,
  },
  {
    weight: 10,
    tag: 'resource_detail_cold',
    path: `/resources/${COLD_SLUG}`,
  },
  {
    weight: 5,
    tag: 'creator_hot',
    path: `/creators/${HOT_CREATOR}`,
  },
];

const totalWeight = routes.reduce((sum, route) => sum + route.weight, 0);

function pickWeightedRoute() {
  const threshold = Math.random() * totalWeight;
  let running = 0;

  for (const route of routes) {
    running += route.weight;
    if (threshold <= running) {
      return route;
    }
  }

  return routes[routes.length - 1];
}

export default function () {
  const route = pickWeightedRoute();
  const response = http.get(`${BASE_URL}${route.path}`, {
    headers: route.cookie ? { Cookie: route.cookie } : undefined,
    tags: { route: route.tag },
  });

  check(response, {
    'public mix route returns 200': (res) => res.status === 200,
  });

  sleep(1);
}

/**
 * How to use:
 * - Start with the single-route scripts to establish which route family degrades first.
 * - Run this weighted mix after the isolated scripts to confirm the real public blend.
 *
 * What to look for:
 * - p95 latency spikes by route tag
 * - error-rate changes under ramp-up
 * - whether control/newest or recommended listing branches dominate tail latency
 *
 * Recommended first scripts to run:
 * - k6/routes/resources-home.js
 * - k6/routes/listing-newest-control.js
 * - k6/routes/listing-recommended-experiment.js
 */
