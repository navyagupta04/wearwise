// YouCam's exact endpoint varies by account tier; this safe fallback keeps local demos usable.
export async function analyzeSkin(imageUrl) { return { undertone: 'neutral', tone_value: 'medium', raw_response: { source: 'fallback', imageUrl } }; }
