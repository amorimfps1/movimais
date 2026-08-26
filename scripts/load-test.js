import http from 'k6/http';
import { sleep, check } from 'k6';

const SUPABASE_URL = __ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error("Missing env variables: SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD");
}

export const options = {
  scenarios: {
    read_heavy: {
      executor: 'constant-vus',
      vus: 30,
      duration: '2m',
      exec: 'read_heavy',
    },
    write_operations: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      exec: 'write_operations',
    },
    concurrent_payments: {
      executor: 'constant-vus',
      vus: 20,
      duration: '1.5m',
      exec: 'concurrent_payments',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const payload = JSON.stringify({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  const params = {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);
  check(res, {
    'auth successful': (r) => r.status === 200,
  });

  return { accessToken: res.json('access_token') };
}

function getParams(token) {
  return {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
  };
}

function generateId() {
  const chars = '0123456789ABCDEF';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function read_heavy(data) {
  const params = getParams(data.accessToken);

  const res1 = http.get(`${SUPABASE_URL}/rest/v1/alunos?select=*`, params);
  check(res1, { 'status 200 alunos': (r) => r.status === 200 });

  const res2 = http.get(`${SUPABASE_URL}/rest/v1/matriculas?select=*`, params);
  check(res2, { 'status 200 matriculas': (r) => r.status === 200 });

  const res3 = http.get(`${SUPABASE_URL}/rest/v1/modalidades?select=*`, params);
  check(res3, { 'status 200 modalidades': (r) => r.status === 200 });

  sleep(1);
}

export function write_operations(data) {
  const params = getParams(data.accessToken);

  const payload = JSON.stringify({
    id: generateId(),
    nome: `Lead ${generateId()}`,
    data_entrada: new Date().toISOString().split('T')[0],
  });

  const res = http.post(`${SUPABASE_URL}/rest/v1/leads`, payload, params);
  check(res, { 'status 201 leads': (r) => r.status === 201 });

  sleep(2);
}

export function concurrent_payments(data) {
  const params = getParams(data.accessToken);

  const payload = JSON.stringify({
    id: generateId(),
    valor_previsto: Math.floor(Math.random() * 200),
    status_pagamento: 'PREVISTO',
  });

  const res = http.post(`${SUPABASE_URL}/rest/v1/pagamentos`, payload, params);
  check(res, { 'status 201 pagamentos': (r) => r.status === 201 });

  sleep(1);
}
