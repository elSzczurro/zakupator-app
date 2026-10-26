import express from 'express';
import cors from 'cors';

const { GEMINI_API_KEY, SERPAPI_KEY, PORT = 3000 } = process.env;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// --- wyszukiwanie ofert w całym internecie (Google Shopping, Polska) ---
async function shopping(q, limit = 40) {
  if (!SERPAPI_KEY) throw new Error('Brak SERPAPI_KEY na serwerze.');
  const url = new URL('https://serpapi.com/search.json');
  url.search = new URLSearchParams({
    engine: 'google_shopping', q, gl: 'pl', hl: 'pl', google_domain: 'google.pl', num: String(limit), api_key: SERPAPI_KEY,
  });
  const r = await fetch(url);
  if (!r.ok) throw new Error('Błąd wyszukiwarki ofert.');
  const d = await r.json();
  return (d.shopping_results || [])
    .map((x) => ({
      title: x.title,
      price: x.extracted_price,
      price_text: x.price,
      source: x.source,
      link: x.product_link || x.link,
      thumbnail: x.thumbnail,
      delivery: x.delivery,
    }))
    .filter((x) => typeof x.price === 'number');
}

// KUP: najtańsze na górze
app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'Wpisz, czego szukasz.' });
    const items = (await shopping(q)).sort((a, b) => a.price - b.price);
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SPRZEDAJ: Gemini (darmowy plan) rozpoznaje przedmiot, potem wycena z realnych ofert
app.post('/api/valuate', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) throw new Error('Brak GEMINI_API_KEY na serwerze.');
    const { image, mime = 'image/jpeg' } = req.body;
    if (!image) return res.status(400).json({ error: 'Brak zdjęcia.' });

    const prompt =
      'Rozpoznaj przedmiot na zdjęciu pod kątem odsprzedaży w Polsce. Odpowiedz WYŁĄCZNIE JSON-em: ' +
      '{"name": "marka, model, wariant", "query": "krótkie zapytanie do wyszukiwarki ofert", ' +
      '"condition": "krótka ocena stanu ze zdjęcia", "condition_factor": liczba 0.3-1.0, "notes": "na co zwrócić uwagę przy sprzedaży"}';

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: mime, data: image } }, { text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || 'Błąd AI.');
    const text = d.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    const id = JSON.parse(text.replace(/```json|```/g, '').trim());

    const offers = (await shopping(id.query, 30)).sort((a, b) => a.price - b.price);
    const prices = offers.map((o) => o.price);
    const pct = (p) => (prices.length ? prices[Math.min(prices.length - 1, Math.floor(p * prices.length))] : null);

    // używane zwykle taniej niż nowe, więc korygujemy współczynnikiem stanu
    const f = Math.min(1, Math.max(0.3, Number(id.condition_factor) || 0.7)) * 0.85;
    const adj = (v) => (v == null ? null : v * f);

    res.json({
      name: id.name,
      condition: id.condition,
      notes: id.notes,
      price_low: adj(pct(0.1)),
      price_mid: adj(pct(0.5)),
      price_high: adj(pct(0.9)),
      price_fast: adj(pct(0.3)),
      offers: offers.slice(0, 6),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Zakupator server: http://localhost:${PORT}`));
