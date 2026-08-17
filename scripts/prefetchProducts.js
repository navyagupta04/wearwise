/**
 * Prefetch script — builds the reusable product catalog with VTO-ready garment images.
 *
 * Strategy: use Google Images (white-background filter) to get clean flat-lay/
 * mannequin images that YouCam VTO works best with. One SERP API credit per search
 * query. This runs ONCE to populate data/prefetched-products.json; no credits are
 * consumed at runtime.
 *
 * Run with: node scripts/prefetchProducts.js
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { searchImages } from '../server/integrations/shoppingSearchClient.js';
dotenv.config();

if (!process.env.SHOPPING_SEARCH_API_KEY || process.env.SHOPPING_SEARCH_API_KEY.startsWith('replace_'))
  throw new Error('SHOPPING_SEARCH_API_KEY is required. Add it to .env and re-run this script.');

// Each entry: [search query, gender, occasion_tags, category, color, name, price, source_site, buy_url]
const searches = [
  // ── Men – Wedding ──────────────────────────────────────────────────────────
  ['mens black suit wedding product flat lay', 'man', 'wedding', 'suit', 'black', 'Black Formal Suit', '$158', 'Wearwise Studio', 'https://example.com/wearwise/suit-black-m'],
  ['mens navy blue suit wedding product flat lay', 'man', 'wedding', 'suit', 'navy', 'Navy Wedding Suit', '$175', 'Wearwise Studio', 'https://example.com/wearwise/suit-navy-m'],
  ['mens charcoal suit formal wedding flat lay', 'man', 'wedding', 'suit', 'black', 'Charcoal Wedding Suit', '$165', 'Wearwise Studio', 'https://example.com/wearwise/suit-charcoal-m'],
  ['mens white dress shirt wedding flat lay', 'man', 'wedding', 'shirt', 'white', 'White Dress Shirt', '$59', 'Wearwise Studio', 'https://example.com/wearwise/shirt-white-m'],
  ['mens cream bandhgala kurta wedding flat lay', 'man', 'wedding', 'kurta', 'white', 'Cream Bandhgala Kurta', '$120', 'Wearwise Studio', 'https://example.com/wearwise/kurta-cream-m'],
  // ── Men – Office / Interview ───────────────────────────────────────────────
  ['mens navy blazer office product flat lay', 'man', 'office,interview', 'blazer', 'navy', 'Navy Tailored Blazer', '$99', 'Wearwise Studio', 'https://example.com/wearwise/blazer-navy-m'],
  ['mens white formal shirt office flat lay', 'man', 'office,interview', 'shirt', 'white', 'White Oxford Shirt', '$55', 'Wearwise Studio', 'https://example.com/wearwise/shirt-oxford-m'],
  ['mens black dress trousers office flat lay', 'man', 'office,interview', 'trousers', 'black', 'Black Dress Trousers', '$79', 'Wearwise Studio', 'https://example.com/wearwise/trousers-black-m'],
  // ── Men – Party / Dinner ──────────────────────────────────────────────────
  ['mens black party shirt dinner flat lay', 'man', 'party,dinner', 'shirt', 'black', 'Black Party Shirt', '$65', 'Wearwise Studio', 'https://example.com/wearwise/shirt-black-m'],
  ['mens burgundy polo shirt party flat lay', 'man', 'party,dinner', 'shirt', 'red', 'Burgundy Polo Shirt', '$49', 'Wearwise Studio', 'https://example.com/wearwise/polo-burgundy-m'],
  // ── Men – Casual ──────────────────────────────────────────────────────────
  ['mens blue casual overshirt flat lay', 'man', 'casual', 'shirt', 'blue', 'Blue Casual Overshirt', '$45', 'Wearwise Studio', 'https://example.com/wearwise/overshirt-blue-m'],
  ['mens navy chino trousers flat lay', 'man', 'casual,office', 'trousers', 'navy', 'Navy Chino Trousers', '$59', 'Wearwise Studio', 'https://example.com/wearwise/chino-navy-m'],
  ['mens forest green overshirt flat lay', 'man', 'casual', 'shirt', 'green', 'Forest Green Overshirt', '$55', 'Wearwise Studio', 'https://example.com/wearwise/overshirt-green-m'],
  // ── Women – Wedding ───────────────────────────────────────────────────────
  ['womens black wedding guest dress product flat lay', 'woman', 'wedding', 'dress', 'black', 'Black Wedding Guest Dress', '$145', 'Wearwise Studio', 'https://example.com/wearwise/dress-black-w'],
  ['womens emerald green midi dress wedding flat lay', 'woman', 'wedding', 'dress', 'emerald', 'Emerald Satin Midi Dress', '$139', 'Wearwise Studio', 'https://example.com/wearwise/dress-emerald-w'],
  ['womens navy blue formal dress wedding flat lay', 'woman', 'wedding', 'dress', 'navy', 'Navy Formal Dress', '$129', 'Wearwise Studio', 'https://example.com/wearwise/dress-navy-w'],
  ['womens gold strappy heels wedding flat lay', 'woman', 'wedding', 'heels', 'gold', 'Gold Strappy Heels', '$89', 'Wearwise Studio', 'https://example.com/wearwise/heels-gold-w'],
  ['womens champagne silk camisole wedding flat lay', 'woman', 'wedding', 'top', 'gold', 'Champagne Silk Camisole', '$79', 'Wearwise Studio', 'https://example.com/wearwise/cami-champagne-w'],
  // ── Women – Office ────────────────────────────────────────────────────────
  ['womens formal black blazer office flat lay', 'woman', 'office,interview', 'blazer', 'black', 'Black Formal Blazer', '$99', 'Wearwise Studio', 'https://example.com/wearwise/blazer-black-w'],
  ['womens white blouse office flat lay', 'woman', 'office,interview', 'blouse', 'white', 'White Office Blouse', '$55', 'Wearwise Studio', 'https://example.com/wearwise/blouse-white-w'],
  ['womens black trousers office flat lay', 'woman', 'office,interview', 'trousers', 'black', 'Black Office Trousers', '$79', 'Wearwise Studio', 'https://example.com/wearwise/trousers-black-w'],
  // ── Women – Party / Casual ────────────────────────────────────────────────
  ['womens black party cocktail dress flat lay', 'woman', 'party,dinner', 'dress', 'black', 'Black Cocktail Dress', '$119', 'Wearwise Studio', 'https://example.com/wearwise/dress-cocktail-w'],
  ['womens red party top flat lay', 'woman', 'party,dinner', 'top', 'red', 'Red Party Top', '$45', 'Wearwise Studio', 'https://example.com/wearwise/top-red-w'],
  ['womens lavender wrap dress casual flat lay', 'woman', 'casual,dinner', 'dress', 'purple', 'Lavender Wrap Dress', '$89', 'Wearwise Studio', 'https://example.com/wearwise/dress-lavender-w'],
  // ── Unisex ────────────────────────────────────────────────────────────────
  ['unisex black blazer formal flat lay', 'unisex', 'wedding,office,interview', 'blazer', 'black', 'Black Unisex Blazer', '$109', 'Wearwise Studio', 'https://example.com/wearwise/blazer-black-u'],
];

const products = [];
let rank = 1;

for (const [query, gender, occasion_tags, category, color, name, price, source_site, buy_url] of searches) {
  console.log(`🔍 ${query}…`);
  const images = await searchImages(query, 4);
  if (!images.length) {
    console.warn(`  ⚠  No images found, skipping.`);
    continue;
  }
  for (const image_url of images) {
    products.push({ name, source_site, image_url, vto_image_url: image_url, buy_url, price, category, color, gender, occasion_tags, rank });
    rank++;
  }
  console.log(`  ✓ ${images.length} VTO-ready images added`);
  // Small delay to be polite to the API
  await new Promise(r => setTimeout(r, 300));
}

if (products.length < 30)
  throw new Error(`Only ${products.length} images found — catalog not saved. Check your SHOPPING_SEARCH_API_KEY.`);

const output = path.join(process.cwd(), 'data', 'prefetched-products.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(products.slice(0, 100), null, 2));
console.log(`\n✅ Saved ${Math.min(products.length, 100)} VTO-ready garment images to ${output}`);
console.log(`   Total SERP credits used: ${searches.length} (one Google Images search per garment type)`);
