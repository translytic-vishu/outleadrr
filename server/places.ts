/**
 * SerpAPI — Google Local API
 * Replaces the Google Places API (which required billing enabled).
 * Env var: SERPAPI_KEY
 * Docs: https://serpapi.com/local-results
 */

const SERP_BASE = "https://serpapi.com/search.json";

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  types: string[];
}

/**
 * Search local businesses via SerpAPI Google Local.
 * Returns up to `limit` results with full details in one request.
 */
export async function searchLocalBusinesses(
  businessType: string,
  location: string,
  limit = 15
): Promise<PlaceDetails[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY is not configured. Add it in your Vercel environment variables.");

  const params = new URLSearchParams({
    engine: "google_local",
    q: businessType,
    location,
    api_key: key,
    hl: "en",
    gl: "us",
    num: String(Math.min(limit, 20)),
  });

  const url = `${SERP_BASE}?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`SerpAPI request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as any;

  // SerpAPI error handling
  if (data.error) throw new Error(`SerpAPI: ${data.error}`);

  const results: any[] = data.local_results || [];

  return results.slice(0, limit).map((r: any, i: number) => ({
    placeId: r.place_id || `serp_${i}_${Date.now()}`,
    name: r.title || r.name || "Unknown",
    address: r.address || "",
    phone: r.phone || "",
    website: r.website || "",
    rating: typeof r.rating === "number" ? r.rating : parseFloat(r.rating) || 0,
    reviewCount: r.reviews || r.review_count || 0,
    types: r.type ? [r.type] : [],
  }));
}

/** Legacy shim — routes.ts calls searchPlaces(query) + getPlaceDetails(id) separately.
 *  We cache the SerpAPI results in a Map so the second call is free.
 */
const _cache = new Map<string, PlaceDetails[]>();

export async function searchPlaces(query: string): Promise<{ placeId: string; name: string }[]> {
  // query is "businessType in location" — split on " in "
  const match = query.match(/^(.+?)\s+in\s+(.+)$/i);
  const businessType = match ? match[1].trim() : query;
  const location     = match ? match[2].trim() : "United States";

  const results = await searchLocalBusinesses(businessType, location, 20);
  _cache.set(query, results);

  return results.map(r => ({ placeId: r.placeId, name: r.name }));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  // Search the cache for a matching record
  for (const results of _cache.values()) {
    const found = results.find(r => r.placeId === placeId);
    if (found) return found;
  }
  // Fallback — shouldn't happen in normal flow
  throw new Error(`Place details not found for id: ${placeId}. This is a cache miss — ensure searchPlaces() is called first.`);
}

export function scorePlace(details: PlaceDetails, businessType: string) {
  const { rating, reviewCount, phone, website, types } = details;
  const hasPhone   = !!phone;
  const hasWebsite = !!website;

  const btype   = businessType.toLowerCase().replace(/s$/, "");
  const typeStr = types.join(" ").toLowerCase();
  const industryFit =
    typeStr.includes(btype) || typeStr.includes(businessType.toLowerCase()) ? 90 : 68;

  const businessSize =
    reviewCount >= 500 ? 95 :
    reviewCount >= 200 ? 85 :
    reviewCount >= 100 ? 72 :
    reviewCount >= 50  ? 58 :
    reviewCount >= 20  ? 44 :
    reviewCount >= 5   ? 32 : 20;

  const reachability = 20 + (hasPhone ? 40 : 0) + (hasWebsite ? 40 : 0);

  const opportunity =
    rating === 0               ? 75 :
    rating >= 3.7 && rating <= 4.4 ? 88 :
    rating > 4.4               ? 62 :
    rating >= 3.0              ? 52 : 35;

  const reviewHealth = rating === 0 ? 50 : Math.round((rating / 5) * 100);

  const score = Math.round(
    industryFit  * 0.25 +
    businessSize * 0.20 +
    reachability * 0.25 +
    opportunity  * 0.15 +
    reviewHealth * 0.15,
  );

  const scoreLabel =
    score >= 75 ? "Strong Lead" :
    score >= 55 ? "Good Lead" : "Weak Lead";

  return {
    score,
    scoreLabel,
    scoreBreakdown: { industryFit, businessSize, reachability, opportunity, reviewHealth },
  };
}
