/**
 * Intelligent eCommerce Search Engine for AURA Jewellery
 *
 * Provides domain-specific jewellery search with:
 * - Lemmatization & singular/plural matching (ring <-> rings, earring <-> earrings)
 * - Target audience / gender intent extraction (women, female, ladies, men, kids)
 * - Category-aware weighting & strict category conflict prevention (rings never match earrings)
 * - Synonym expansion (solitaire <-> diamond, stud <-> earring, band <-> ring)
 * - Multi-field scoring across name, category, description, gender_tag, and occasion_tags
 * - Multi-stage fallback before returning zero results
 */

// Generic stop words & search filler words
const STOP_WORDS = new Set([
  'for', 'in', 'and', 'with', 'the', 'a', 'an', 'of', 'to', 'by', 'on', 'at', 'from', 'is', 'it', 'or',
  'jewellery', 'jewelry', 'jewel', 'jewels', 'ornament', 'ornaments',
  'collection', 'collections', 'piece', 'pieces', 'item', 'items',
  'design', 'designs', 'wear', 'buy', 'shop', 'online', 'store', 'show', 'find', 'looking'
]);

// Gender intent mapping
const GENDER_INTENT_MAP = {
  women: 'women',
  woman: 'women',
  womans: 'women',
  ladies: 'women',
  lady: 'women',
  female: 'women',
  females: 'women',
  girl: 'women',
  girls: 'women',
  men: 'men',
  man: 'men',
  mans: 'men',
  male: 'men',
  males: 'men',
  gentleman: 'men',
  gentlemen: 'men',
  gents: 'men',
  gent: 'men',
  boy: 'men',
  boys: 'men',
  kid: 'kids',
  kids: 'kids',
  children: 'kids',
  child: 'kids',
  baby: 'kids',
  babies: 'kids',
  toddler: 'kids',
  unisex: 'unisex'
};

// Category slug mapping
const CATEGORY_MAP = {
  // Rings
  ring: 'rings',
  rings: 'rings',
  band: 'rings',
  bands: 'rings',
  solitaire: 'rings',
  solitaires: 'rings',

  // Necklaces
  necklace: 'necklaces',
  necklaces: 'necklaces',
  pendant: 'necklaces',
  pendants: 'necklaces',
  chain: 'necklaces',
  chains: 'necklaces',
  choker: 'necklaces',
  chokers: 'necklaces',
  locket: 'necklaces',
  lockets: 'necklaces',
  collar: 'necklaces',
  collars: 'necklaces',
  haar: 'necklaces',
  mala: 'necklaces',

  // Earrings
  earring: 'earrings',
  earrings: 'earrings',
  stud: 'earrings',
  studs: 'earrings',
  jhumka: 'earrings',
  jhumkas: 'earrings',
  drop: 'earrings',
  drops: 'earrings',
  hoop: 'earrings',
  hoops: 'earrings',
  dangler: 'earrings',
  danglers: 'earrings',

  // Bracelets
  bracelet: 'bracelets',
  bracelets: 'bracelets',
  bangle: 'bracelets',
  bangles: 'bracelets',
  kada: 'bracelets',
  kadas: 'bracelets',
  cuff: 'bracelets',
  cuffs: 'bracelets',
  anklet: 'bracelets',
  anklets: 'bracelets',

  // Bridal
  bridal: 'bridal',
  wedding: 'bridal',
  marriage: 'bridal',
  bride: 'bridal',
  brides: 'bridal',
  trousseau: 'bridal',
  set: 'bridal',
  sets: 'bridal',
};

// Domain-specific lemmatization dictionary
const LEMMA_MAP = {
  rings: 'ring',
  earrings: 'earring',
  necklaces: 'necklace',
  bracelets: 'bracelet',
  pendants: 'pendant',
  chains: 'chain',
  bands: 'band',
  studs: 'stud',
  drops: 'drop',
  chokers: 'choker',
  bangles: 'bangle',
  kadas: 'kada',
  cuffs: 'cuff',
  charms: 'charm',
  lockets: 'locket',
  sets: 'set',
  diamonds: 'diamond',
  pearls: 'pearl',
  solitaires: 'solitaire',
  gemstones: 'gemstone',
  stones: 'stone',
  females: 'female',
  ladies: 'lady',
  women: 'woman',
  girls: 'girl',
  boys: 'boy',
  men: 'man',
  children: 'child',
  kids: 'kid',
  babies: 'baby'
};

// Synonym / conceptual associations
const SYNONYMS = {
  ring: ['band', 'solitaire', 'rings'],
  rings: ['band', 'solitaire', 'ring'],
  band: ['ring', 'rings'],
  bands: ['ring', 'rings'],
  solitaire: ['ring', 'diamond', 'stone'],
  diamond: ['solitaire', 'cz', 'stone', 'gem', 'gemstone', 'crystal'],
  diamonds: ['solitaire', 'cz', 'stone', 'gem', 'gemstone', 'crystal'],
  gold: ['rose gold', 'yellow gold', 'band', 'studs'],
  pearl: ['pearls', 'moti', 'freshwater'],
  pearls: ['pearl', 'freshwater'],
  kundan: ['jadau', 'polki', 'traditional', 'bridal'],
  earring: ['stud', 'studs', 'drop', 'drops', 'jhumka', 'earrings'],
  earrings: ['stud', 'studs', 'drop', 'drops', 'jhumka', 'earring'],
  stud: ['earring', 'earrings', 'studs'],
  studs: ['earring', 'earrings', 'stud'],
  drop: ['drops', 'earring', 'earrings'],
  drops: ['drop', 'earring', 'earrings'],
  necklace: ['necklaces', 'chain', 'pendant', 'choker', 'collar'],
  necklaces: ['necklace', 'chain', 'pendant', 'choker'],
  pendant: ['necklace', 'necklaces', 'locket', 'chain'],
  pendants: ['necklace', 'necklaces', 'locket', 'chain'],
  chain: ['necklace', 'necklaces', 'pendant'],
  chains: ['necklace', 'necklaces', 'pendant'],
  bracelet: ['bracelets', 'bangle', 'bangles', 'kada', 'charm'],
  bracelets: ['bracelet', 'bangle', 'bangles', 'kada', 'charm'],
  bridal: ['kundan', 'wedding', 'set', 'traditional'],
};

/**
 * Reduce a word to its singular/base lemma
 */
function lemmatize(word) {
  if (!word) return '';
  const lower = word.toLowerCase();
  if (LEMMA_MAP[lower]) return LEMMA_MAP[lower];
  if (lower.endsWith('ies') && lower.length > 4) {
    return lower.slice(0, -3) + 'y';
  }
  if (lower.endsWith('es') && (lower.endsWith('shes') || lower.endsWith('ches') || lower.endsWith('sses') || lower.endsWith('xes') || lower.endsWith('zes'))) {
    return lower.slice(0, -2);
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 3) {
    return lower.slice(0, -1);
  }
  return lower;
}

/**
 * Clean and break a text string into word tokens
 */
function tokenize(text) {
  if (!text) return [];
  let cleaned = text.toString().toLowerCase().replace(/'s\b/g, '').replace(/’s\b/g, '');
  cleaned = cleaned.replace(/[^a-z0-9]+/g, ' ');
  return cleaned.trim().split(/\s+/).filter(Boolean);
}

/**
 * Parse a raw user search query into structured search intent
 */
function parseQuery(rawQuery) {
  const rawTokens = tokenize(rawQuery);
  const targetGenders = new Set();
  const targetCategories = new Set();
  const categoryTokens = new Set();
  const contentTokens = [];
  const lemmaTokens = [];
  const synonymTokens = new Set();

  for (const token of rawTokens) {
    if (GENDER_INTENT_MAP[token]) {
      targetGenders.add(GENDER_INTENT_MAP[token]);
    }
    const lemma = lemmatize(token);
    if (CATEGORY_MAP[token]) {
      targetCategories.add(CATEGORY_MAP[token]);
      categoryTokens.add(token);
    }
    if (CATEGORY_MAP[lemma]) {
      targetCategories.add(CATEGORY_MAP[lemma]);
      categoryTokens.add(lemma);
    }
    if (SYNONYMS[token]) {
      SYNONYMS[token].forEach((s) => synonymTokens.add(s));
    }
    if (SYNONYMS[lemma]) {
      SYNONYMS[lemma].forEach((s) => synonymTokens.add(s));
    }

    if (!STOP_WORDS.has(token) && !GENDER_INTENT_MAP[token]) {
      contentTokens.push(token);
      lemmaTokens.push(lemma);
    }
  }

  const numericId =
    Number.isInteger(Number(rawQuery.trim())) && Number(rawQuery.trim()) > 0
      ? Number(rawQuery.trim())
      : null;

  return {
    rawQuery: rawQuery.trim().toLowerCase(),
    rawTokens,
    targetGenders: Array.from(targetGenders),
    targetCategories: Array.from(targetCategories),
    categoryTokens: Array.from(categoryTokens),
    contentTokens,
    lemmaTokens,
    synonymTokens: Array.from(synonymTokens),
    numericId,
  };
}

/**
 * Calculate relevance score for a product given parsed search intent
 */
function scoreProduct(product, parsed) {
  let score = 0;
  const reasons = [];

  // 1. Direct ID match (for admin/SKU searches)
  if (parsed.numericId !== null && product.id === parsed.numericId) {
    score += 500;
    reasons.push('exact_id_match');
    return { score, reasons, isConflict: false };
  }

  const productTokens = tokenize(product.name);
  const productLemmas = productTokens.map(lemmatize);
  const productCategorySlug = (product.category_slug || '').toLowerCase();
  const descTokens = tokenize(product.description || '');
  const descLemmas = descTokens.map(lemmatize);
  const occasionTokens = tokenize(product.occasion_tags || '');

  // 2. Category intent match & conflict check
  const hasCategoryIntent = parsed.targetCategories.length > 0;
  let hasCategoryConflict = false;

  if (hasCategoryIntent) {
    if (parsed.targetCategories.includes(productCategorySlug)) {
      score += 150;
      reasons.push(`matches_category:${productCategorySlug}`);
    } else {
      // Product category doesn't match any targeted category!
      // Only allow if product explicitly contains the targeted category word (or lemma) in title
      const titleHasCategoryWord = parsed.categoryTokens.some(
        (catToken) =>
          productTokens.includes(catToken) ||
          productLemmas.includes(lemmatize(catToken))
      );
      if (!titleHasCategoryWord) {
        hasCategoryConflict = true;
        score -= 1000;
        reasons.push(`category_conflict:want_${parsed.targetCategories.join(',')}_got_${productCategorySlug}`);
      }
    }
  }

  // 3. Exact full phrase match in title
  const cleanTitle = (product.name || '').toLowerCase();
  if (parsed.rawQuery && cleanTitle.includes(parsed.rawQuery)) {
    score += 120;
    reasons.push('exact_phrase_in_title');
  }

  // 4. Token matches in Product Title (Whole word & Lemma)
  for (let i = 0; i < parsed.contentTokens.length; i++) {
    const token = parsed.contentTokens[i];
    const lemma = parsed.lemmaTokens[i];

    if (productTokens.includes(token)) {
      score += 80;
      reasons.push(`token_in_title:${token}`);
    } else if (productLemmas.includes(lemma)) {
      score += 70;
      reasons.push(`lemma_in_title:${lemma}`);
    } else if (
      parsed.synonymTokens.some(
        (syn) => productTokens.includes(syn) || productLemmas.includes(syn)
      )
    ) {
      score += 40;
      reasons.push(`synonym_in_title_for:${token}`);
    }
  }

  // 5. Gender / Target Audience Match
  if (parsed.targetGenders.length > 0) {
    const productGender = (product.gender_tag || '').toLowerCase();
    if (parsed.targetGenders.includes(productGender)) {
      score += 90;
      reasons.push(`gender_match:${productGender}`);
    } else if (!productGender || productGender === 'unisex') {
      score += 20; // neutral
      reasons.push('gender_neutral');
    } else {
      score += 5; // fallback for other gender
      reasons.push(`gender_other:${productGender}`);
    }
  }

  // 6. Material / Gemstone boost in title or description
  const materials = ['gold', 'diamond', 'silver', 'pearl', 'kundan', 'solitaire', 'ruby', 'emerald', 'sapphire'];
  for (const mat of materials) {
    if (parsed.rawTokens.includes(mat)) {
      if (productTokens.includes(mat)) {
        score += 60;
        reasons.push(`material_in_title:${mat}`);
      } else if (descTokens.includes(mat)) {
        score += 25;
        reasons.push(`material_in_desc:${mat}`);
      }
    }
  }

  // 7. Token matches in Description
  for (let i = 0; i < parsed.contentTokens.length; i++) {
    const token = parsed.contentTokens[i];
    const lemma = parsed.lemmaTokens[i];
    if (descTokens.includes(token)) {
      score += 20;
      reasons.push(`token_in_desc:${token}`);
    } else if (descLemmas.includes(lemma)) {
      score += 15;
      reasons.push(`lemma_in_desc:${lemma}`);
    }
  }

  // 8. Occasion tags match
  for (const token of parsed.rawTokens) {
    if (occasionTokens.includes(token)) {
      score += 40;
      reasons.push(`occasion_match:${token}`);
    }
  }

  return { score, reasons, isConflict: hasCategoryConflict };
}

/**
 * Filter and rank products using intelligent search algorithm
 *
 * @param {Array} allProducts - List of candidate product objects
 * @param {string} searchQuery - Search query string
 * @returns {Array} - Ranked array of matching products
 */
function searchProducts(allProducts, searchQuery) {
  if (!searchQuery || !searchQuery.trim()) {
    return allProducts;
  }

  const parsed = parseQuery(searchQuery);
  const scored = allProducts.map((p) => {
    const { score, reasons, isConflict } = scoreProduct(p, parsed);
    return { product: p, score, reasons, isConflict };
  });

  // Strict match: positive score and not in category conflict
  let validMatches = scored.filter((item) => item.score > 0 && !item.isConflict);

  // Fallback 1: If no strict matches and target category was detected,
  // return products in that category (e.g. searching "platinum ring" returns rings)
  if (validMatches.length === 0 && parsed.targetCategories.length > 0) {
    validMatches = scored.filter((item) => {
      const pCat = (item.product.category_slug || '').toLowerCase();
      return parsed.targetCategories.includes(pCat);
    });
  }

  // Fallback 2: If still no matches and multiple content tokens were provided,
  // relax query to any product matching at least one token with positive score
  if (validMatches.length === 0 && parsed.contentTokens.length > 1) {
    validMatches = scored.filter((item) => !item.isConflict && item.score > 0);
  }

  // Sort by score DESC, then created_at DESC
  validMatches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.product.created_at) - new Date(a.product.created_at);
  });

  return validMatches.map((m) => m.product);
}

module.exports = {
  tokenize,
  lemmatize,
  parseQuery,
  scoreProduct,
  searchProducts,
};
