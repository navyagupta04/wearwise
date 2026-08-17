// Builds the reusable catalog from real Google Shopping products, not generated placeholders.
import dotenv from 'dotenv'; import fs from 'fs'; import path from 'path'; import { searchShopping } from '../server/integrations/shoppingSearchClient.js';
dotenv.config();
if (!process.env.SHOPPING_SEARCH_API_KEY || process.env.SHOPPING_SEARCH_API_KEY.startsWith('replace_')) throw new Error('SHOPPING_SEARCH_API_KEY is required to build the real-product catalog.');
const searches = [
 ['mens black suit wedding guest','man','wedding','suit','black'],['mens navy suit wedding guest','man','wedding','suit','navy'],['mens charcoal suit formal wedding','man','wedding','suit','black'],['mens white dress shirt wedding','man','wedding','shirt','white'],['mens brown loafers wedding','man','wedding','shoes','brown'],
 ['mens blazer office navy','man','office,interview','blazer','navy'],['mens formal shirt office white','man','office,interview','shirt','white'],['mens black trousers office','man','office,interview','trousers','black'],['mens casual overshirt blue','man','casual','shirt','blue'],['mens black party shirt','man','party,dinner','shirt','black'],
 ['womens black wedding guest dress','woman','wedding','dress','black'],['womens emerald wedding guest dress','woman','wedding','dress','emerald'],['womens navy wedding guest dress','woman','wedding','dress','navy'],['womens gold heels wedding guest','woman','wedding','heels','gold'],['womens formal blazer office','woman','office,interview','blazer','black'],
 ['womens white blouse office','woman','office,interview','blouse','white'],['womens black trousers office','woman','office,interview','trousers','black'],['womens blue crop top casual','woman','casual','top','blue'],['womens black party dress','woman','party,dinner','dress','black'],['womens red party top','woman','party,dinner','top','red'],
 ['unisex denim jacket casual','unisex','casual','jacket','blue'],['unisex black leather jacket dinner','unisex','dinner,party','jacket','black'],['unisex beige trench coat formal','unisex','office,interview','coat','beige'],['unisex white sneakers casual','unisex','casual','shoes','white'],['unisex black blazer formal','unisex','wedding,office,interview','blazer','black']
];
const products=[], known=new Set();
for (const [query,gender,occasion_tags,category,color] of searches) {
  const results=await searchShopping(query);
  for (const result of results.slice(0,4)) {
    if (!result.image_url || !result.buy_url) continue;
    const key=result.buy_url; if (known.has(key)) continue; known.add(key);
    products.push({...result,gender,occasion_tags,category,color,rank:products.length+1});
  }
  console.log(`${query}: ${results.length} results`);
}
if (products.length < 80) throw new Error(`Only ${products.length} usable Shopping results were found; catalog was not overwritten.`);
const output=path.join(process.cwd(),'data','prefetched-products.json'); fs.mkdirSync(path.dirname(output),{recursive:true}); fs.writeFileSync(output,JSON.stringify(products.slice(0,100),null,2)); console.log(`Saved ${Math.min(products.length,100)} real shopping products to ${output}`);
