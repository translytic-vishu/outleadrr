/**
 * SerpAPI — Google Local API
 * Replaces the Google Places API (which required billing enabled).
 * Env var: SERPAPI_KEY
 * Docs: https://serpapi.com/local-results
 */

const SERP_BASE = "https://serpapi.com/search.json";

/* ─── US state abbreviation → full name ────────────────────────── */
const STATE_MAP: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",
  KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",
  MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",
  NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",
  NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",
  OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
  DC:"Washington DC",
};

/**
 * Normalise a user-typed location for SerpAPI.
 * "Fulshear Tx" → "Fulshear, Texas"
 * "Austin TX"   → "Austin, Texas"
 * "New York"    → "New York"  (unchanged)
 */
function normalizeLocation(raw: string): string {
  const trimmed = raw.trim();
  // Already has a comma — trust the user
  if (trimmed.includes(",")) return trimmed;

  // Match "City ST" or "City State" patterns
  const abbrevMatch = trimmed.match(/^(.+?)\s+([A-Za-z]{2})$/);
  if (abbrevMatch) {
    const city = abbrevMatch[1].trim();
    const abbrev = abbrevMatch[2].toUpperCase();
    const fullState = STATE_MAP[abbrev];
    if (fullState) return `${city}, ${fullState}`;
  }

  // Match "City FullStateName" — e.g. "Austin Texas"
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    for (const [abbr, full] of Object.entries(STATE_MAP)) {
      const last = words[words.length - 1];
      if (last.toLowerCase() === full.toLowerCase() || last.toUpperCase() === abbr) {
        const city = words.slice(0, -1).join(" ");
        return `${city}, ${full}`;
      }
    }
  }

  return trimmed;
}

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

  const results = await searchLocalBusinesses(businessType, normalizeLocation(location), 20);
  _cache.set(query, results);

  return results.map(r => ({ placeId: r.placeId, name: r.name }));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  // Search the cache for a matching record
  for (const results of Array.from(_cache.values())) {
    const found = results.find((r: PlaceDetails) => r.placeId === placeId);
    if (found) return found;
  }
  // Fallback — shouldn't happen in normal flow
  throw new Error(`Place details not found for id: ${placeId}. This is a cache miss — ensure searchPlaces() is called first.`);
}

/**
 * Scrape a real contact email from a business website.
 * Checks homepage + /contact + /contact-us. Prefers mailto: links.
 * Falls back to info@ / contact@ pattern if nothing scraped.
 */
export async function scrapeEmailFromWebsite(website: string): Promise<string | null> {
  if (!website) return null;
  const base = (website.startsWith("http") ? website : `https://${website}`).replace(/\/+$/, "");

  const skipPattern = /noreply|no-reply|mailer|daemon|bounce|sentry|example\.|w3\.org|schema\.org|wix\.|squarespace|wordpress|googleapis|cloudflare|jsdelivr|jquery|bootstrap|facebook|twitter|instagram|linkedin/i;

  const pagesToTry = [base, `${base}/contact`, `${base}/contact-us`, `${base}/about`];

  for (const url of pagesToTry) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(7000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Outleadrr/1.0; email-finder)",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Priority 1: mailto: href links (most reliable)
      const mailtoReg = /href=["']mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})["']/gi;
      const mailtoEmails: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = mailtoReg.exec(html)) !== null) mailtoEmails.push(m[1].toLowerCase());

      // Priority 2: plain text emails
      const plainReg = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g;
      const plainEmails: string[] = [];
      while ((m = plainReg.exec(html)) !== null) plainEmails.push(m[1].toLowerCase());

      const allEmails = [...new Set([...mailtoEmails, ...plainEmails])].filter(
        e => !skipPattern.test(e)
      );

      if (allEmails.length > 0) {
        // Prefer generic contact addresses over specific ones (they're more reliable)
        const preferred = allEmails.find(e => /^(info|contact|hello|office|admin|mail|team|support|enquir|inquir)@/i.test(e));
        return preferred || allEmails[0];
      }
    } catch {
      // continue to next URL
    }
  }

  // If no email scraped but we have a domain, return info@ (high delivery rate vs guessed firstname@)
  try {
    const domainMatch = base.match(/(?:https?:\/\/)?(?:www\.)?([^\/?\s]+)/);
    if (domainMatch?.[1]) return `info@${domainMatch[1]}`;
  } catch { /* ignore */ }

  return null;
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
