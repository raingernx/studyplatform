import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  scenarios: {
    public_mix: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
  },
};

const BASE = __ENV.BASE_URL || 'https://krucrafts.com';

const routes = [
  '/resources',
  '/resources?category=all',
  '/resources?category=all&sort=newest',
  '/resources?category=all&sort=recommended',
  '/resources/middle-school-science-quiz-assessment-set',
  '/resources/basic-solar-system-flashcards',
  '/creators/kru-mint',
];

export default function () {
  const path = routes[Math.floor(Math.random() * routes.length)];
  const res = http.get(`${BASE}${path}`);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}