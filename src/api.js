import { API_URL } from './config';

async function call(path, options) {
  const res = await fetch(API_URL + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Serwer nie odpowiada. Sprawdź adres w src/config.js.');
  return data;
}

export const valuate = (base64, mime) =>
  call('/api/valuate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, mime }),
  });

export const search = (q) => call('/api/search?q=' + encodeURIComponent(q));
