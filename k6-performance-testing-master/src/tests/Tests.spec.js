import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getCountriesDuration = new Trend('get_countries', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.12'],
    get_countries: ['p(99)<5700'],
    content_OK: ['rate>0.95']
  },
  stages: [
    { duration: '30s', target: 10 },
    { duration: '60s', target: 20 },
    { duration: '60s', target: 15 },
    { duration: '120s', target: 35 },
    { duration: '30s', target: 40 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://restcountries.com/v3.1/name/brazil';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(baseUrl, params);

  getCountriesDuration.add(res.timings.duration);
  RateContentOK.add(res.status === OK);

  check(res, {
    'GET Countries - Status 200': () => res.status === OK,
    'GET Countries - Corpo não vazio': () => res.body.length > 0,
    'GET Countries - Contém Brasil': () => res.body.includes('Brazil')
  });
}
