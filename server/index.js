import express from 'express';
import cors from 'cors';

const { GROQ_API_KEY, SERPAPI_KEY, PORT = 3000 } = process.env;
const GROQ_MODEL = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

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

// SPRZEDAJ: Groq (darmowy plan, model z obsługą obrazu) rozpoznaje przedmiot, potem wycena z realnych ofert
app.post('/api/valuate', async (req, res) => {
  try {
    if (!GROQ_API_KEY) throw new Error('Brak GROQ_API_KEY na serwerze.');
    const { image, mime = 'image/jpeg' } = req.body;
    if (!image) return res.status(400).json({ error: 'Brak zdjęcia.' });

    const prompt =
      'Rozpoznaj przedmiot na zdjęciu pod kątem odsprzedaży w Polsce. Odpowiedz WYŁĄCZNIE JSON-em: ' +
      '{"name": "marka, model, wariant", "query": "krótkie zapytanie do wyszukiwarki ofert", ' +
      '"condition": "krótka ocena stanu ze zdjęcia", "condition_factor": liczba 0.3-1.0, "notes": "na co zwrócić uwagę przy sprzedaży"}';

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${image}` } },
            ],
          },
        ],
      }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || 'Błąd AI.');
    const text = d.choices?.[0]?.message?.content || '';
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
