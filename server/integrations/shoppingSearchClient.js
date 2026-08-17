import axios from 'axios';

const SERP_KEY = () => process.env.SHOPPING_SEARCH_API_KEY;
const isConfigured = () => { const k = SERP_KEY(); return Boolean(k && !k.startsWith('replace_')); };

/** Google Shopping — returns basic product cards with thumbnail images */
export async function searchShopping(query) {
  if (!isConfigured()) return [];
  const { data } = await axios.get('https://serpapi.com/search.json', {
    params: { engine: 'google_shopping', q: query, api_key: SERP_KEY(), num: 10 }
  });
  return (data.shopping_results || []).map((x, i) => ({
    name: x.title,
    source_site: x.source,
    image_url: x.thumbnail,
    buy_url: x.product_link || x.link || x.serpapi_product_api,
    price: x.price,
    category: 'apparel',
    color: '',
    rank: i + 1
  }));
}

/**
 * Google Images — finds clean product images suitable for VTO.
 * Uses white-background filter so garment images have no distracting backgrounds.
 * Returns up to `limit` image URLs.
 */
export async function searchImages(query, limit = 3) {
  if (!isConfigured()) return [];
  try {
    const { data } = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_images',
        q: `${query} on white background`,
        tbs: 'ic:specific,isc:white',   // white dominant colour filter – VTO-ready
        safe: 'active',
        num: 10,
        api_key: SERP_KEY()
      }
    });
    const images = (data.images_results || [])
      .filter(img => img.original && img.original.startsWith('http'))
      .slice(0, limit)
      .map(img => img.original);
    return images;
  } catch {
    return [];
  }
}

/**
 * Enriched shopping search — runs a shopping search then replaces each product's
 * thumbnail with a higher-quality white-background garment image from Google Images.
 * Consumes 1 Shopping credit + 1 Images credit per unique garment type searched.
 */
export async function searchShoppingWithImages(query, garmentCategory = '') {
  const products = await searchShopping(query);
  if (!products.length) return products;
  // One Images search per product batch to find a good garment image for VTO
  const imageQuery = garmentCategory ? `${garmentCategory} ${query} apparel product` : `${query} clothing product`;
  const vtoImages = await searchImages(imageQuery, products.length);
  return products.map((p, i) => ({
    ...p,
    // Prefer the VTO-ready white-bg image; fall back to shopping thumbnail
    image_url: vtoImages[i] || p.image_url,
    vto_image_url: vtoImages[i] || p.image_url
  }));
}
