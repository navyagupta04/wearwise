const model = () => process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const apiKey = () => process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;

export async function refineOutfitRequest({ message, occasion, description, catalog }) {
  if (!apiKey()) throw new Error('Gemini is not configured. Add GEMINI_API_KEY or LLM_API_KEY to .env.');
  const catalogSummary = catalog.slice(0, 100).map(p => `${p.name} [${p.gender}, ${p.occasion_tags}; ${p.category}, ${p.color}]`).join('\n');
  const prompt = `You are Wearwise, a concise personal stylist. A shopper is refining an outfit edit.\nOriginal occasion: ${occasion || 'not specified'}\nOriginal preference: ${description || 'not specified'}\nNew message: ${message}\n\nYou may only recommend items whose category or colour occurs in this catalog:\n${catalogSummary}\n\nReturn a short, helpful stylist reply and search terms that match the catalog. Never claim an item is available if it is not represented in the catalog.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model()}:generateContent`, {
    method: 'POST', headers: { 'x-goog-api-key': apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'object', properties: { reply: { type: 'string' }, search_terms: { type: 'array', items: { type: 'string' } } }, required: ['reply', 'search_terms'] } } })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Gemini request failed (HTTP ${response.status}).`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no stylist response.');
  try { const parsed = JSON.parse(text); return { reply: parsed.reply, searchTerms: Array.isArray(parsed.search_terms) ? parsed.search_terms.join(' ') : message }; }
  catch { throw new Error('Gemini returned an invalid stylist response.'); }
}
