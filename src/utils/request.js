import { pick } from 'lodash';

let canCORS = true;
// const server = 'http://127.0.0.1:8787';
// const server = 'https://blc-proxy.jcms7gd2ym.workers.dev';
const server = 'https://xian2024.cloud/blc-proxy';

export const setCors = bool => (canCORS = bool);

export const getResp = (url, options = {}) =>
  fetch(url, {
    referrer: '',
    headers: { 'Content-Type': 'application/json' },
    referrerPolicy: 'no-referrer',
    ...options,
  });

export const get = (url, options) => getResp(url, options).then(r => r.json());

export const corsGetResp = (url, options) =>
  fetch(server, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, ...pick(options, ['method', 'headers', 'body']) }),
    referrerPolicy: 'origin',
  });

export const corsGet = (url, options) => corsGetResp(url, options).then(r => r.json());

export const autoGet = (url, options) => (canCORS ? get(url, options) : corsGet(url, options));

export const autoGetResp = (url, options) => (canCORS ? getResp(url, options) : corsGetResp(url, options));
