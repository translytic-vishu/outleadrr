/**
 * SerpAPI — Google Local API
 * Replaces the Google Places API (which required billing enabled).
 * Env var: SERPAPI_KEY
 * Docs: https://serpapi.com/local-results
 */
import * as cheerio from "cheerio";
import { youFindEmail } from "./yousearch.js";
import { tavilyFindEmail } from "./tavily.js";

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
  listedEmail?: string; // Email from SerpAPI listing, if present
}

/**
 * Search local businesses via SerpAPI Google Local.
 * Returns up to `limit` results with full details in one request.
 */
async function fetchSerpResults(q: string, location: string | null, key: string, limit: number): Promise<any[]> {
  const params: Record<string, string> = {
    engine: "google_local",
    q,
    api_key: key,
    hl: "en",
    gl: "us",
    num: String(Math.min(limit, 20)),
  };
  if (location) params.location = location;

  const res = await fetch(`${SERP_BASE}?${new URLSearchParams(params)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    // Bubble up so caller can decide whether to retry
    const err: any = new Error(`SerpAPI request failed (${res.status}): ${text}`);
    err.status = res.status;
    throw err;
  }
  const data = (await res.json()) as any;
  if (data.error) {
    const err: any = new Error(`SerpAPI: ${data.error}`);
    err.serpError = data.error;
    throw err;
  }
  return data.local_results || [];
}

export async function searchLocalBusinesses(
  businessType: string,
  location: string,
  limit = 15
): Promise<PlaceDetails[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY is not configured. Add it in your Vercel environment variables.");

  let results: any[];
  try {
    // Primary: use location parameter (works for major cities)
    results = await fetchSerpResults(businessType, location, key, limit);
  } catch (err: any) {
    const isLocationErr = err.status === 400 || (err.serpError && /unsupported.*location/i.test(err.serpError));
    if (!isLocationErr) throw err;

    // Fallback: embed location in query — works for any city/suburb/zip
    console.warn(`[SerpAPI] location param unsupported for "${location}", retrying with q-embedded location`);
    results = await fetchSerpResults(`${businessType} near ${location}`, null, key, limit);
  }

  return results.slice(0, limit).map((r: any, i: number) => ({
    placeId: r.place_id || `serp_${i}_${Date.now()}`,
    name: r.title || r.name || "Unknown",
    address: r.address || "",
    phone: r.phone || "",
    website: r.website || "",
    rating: typeof r.rating === "number" ? r.rating : parseFloat(r.rating) || 0,
    reviewCount: r.reviews || r.review_count || 0,
    types: r.type ? [r.type] : [],
    listedEmail: r.email || "",
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
 * Extract the root domain from a website URL.
 */
function extractDomain(website: string): string | null {
  try {
    const base = website.startsWith("http") ? website : `https://${website}`;
    const url = new URL(base);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Hosted website builder / social media domains — businesses on these
 * don't have their own email inbox, so info@wixsite.com doesn't work.
 */
const HOSTED_DOMAINS = /wixsite\.com|squarespace\.com|weebly\.com|godaddysites\.com|business\.site|sites\.google\.com|jimdo\.com|webflow\.io|webnode\.com|yolasite\.com|blogspot\.com|wordpress\.com|tumblr\.com|shopify\.com|myshopify\.com|yelp\.com|yellowpages\.com|angieslist\.com|thumbtack\.com|houzz\.com|facebook\.com|instagram\.com|twitter\.com|nextdoor\.com|google\.com\/maps|maps\.google|indeed\.com\/cmp/i;

/** Addresses we never want to use */
const SKIP_EMAIL = /noreply|no-reply|mailer|daemon|bounce|sentry|example\.|w3\.org|schema\.org|googleapis|cloudflare|jsdelivr|jquery|bootstrap|privacy@|legal@|dmca@|abuse@|unsubscribe@/i;

/** Prefixes that indicate a genuine contact inbox */
const PREFERRED_PREFIX = /^(info|contact|hello|office|admin|mail|team|support|enquir|inquir|sales|booking|reception|general|studio|shop|help|service|parts|front|desk)@/i;

/** Scrape emails from raw HTML — Cheerio-powered (mailto: links first, then visible text) */
function extractEmailsFromHtml(html: string): string[] {
  const found: string[] = [];
  const plainReg = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g;

  try {
    const $ = cheerio.load(html);

    // 1. mailto: links — highest confidence
    $("a[href^='mailto:'], a[href^='MAILTO:']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const email = href.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
      if (email && email.includes("@")) found.push(email);
    });

    // 2. Visible text in contact-relevant elements (spans, p, li, td, div)
    const contactSelectors = [
      "[class*='contact']","[class*='email']","[id*='contact']","[id*='email']",
      "footer","address","[class*='footer']","[class*='info']",
    ];
    contactSelectors.forEach(sel => {
      try {
        $(sel).each((_, el) => {
          const text = $(el).text();
          let m: RegExpExecArray | null;
          const re = new RegExp(plainReg.source, "g");
          while ((m = re.exec(text)) !== null) found.push(m[1].toLowerCase());
        });
      } catch { /* ignore invalid selector */ }
    });

    // 3. Full-page plain text fallback (catches obfuscated emails in body copy)
    const bodyText = $("body").text();
    let m: RegExpExecArray | null;
    const re2 = new RegExp(plainReg.source, "g");
    while ((m = re2.exec(bodyText)) !== null) found.push(m[1].toLowerCase());
  } catch {
    // Cheerio parse failed — fall back to raw regex
    let m: RegExpExecArray | null;
    const re = new RegExp(plainReg.source, "g");
    while ((m = re.exec(html)) !== null) found.push(m[1].toLowerCase());
  }

  return [...new Set(found)].filter(e => !SKIP_EMAIL.test(e));
}

/** Fetch a page silently — return html or null on any error */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Find a sendable email for a business website.
 *
 * Priority:
 *  1. Real email scraped from website pages (mailto: link or plain text) → use immediately, no DNS needed
 *  2. No scraped email but domain is a real business domain → derive info@domain (almost always works)
 *  3. Domain is a hosted platform (Wix, Yelp, etc.) → return null (can't email these)
 */
export async function scrapeEmailFromWebsite(
  website: string,
  businessName?: string,
  location?: string,
): Promise<string | null> {
  if (!website) return null;
  const base   = (website.startsWith("http") ? website : `https://${website}`).replace(/\/+$/, "");
  const domain = extractDomain(base);
  if (!domain) return null;

  // ── 1. Scrape 5 pages in parallel (Cheerio-powered) ─────────────────
  const pages = [base, `${base}/contact`, `${base}/contact-us`, `${base}/about`, `${base}/about-us`];
  const htmlResults = await Promise.all(pages.map(fetchPage));

  const allEmails: string[] = [];
  for (const html of htmlResults) {
    if (html) allEmails.push(...extractEmailsFromHtml(html));
  }
  const unique = [...new Set(allEmails)];

  if (unique.length > 0) {
    const preferred = unique.find(e => PREFERRED_PREFIX.test(e));
    return preferred || unique[0];
  }

  // ── 2. You.com AI search (primary) — scans directories, review sites ──
  if (businessName && location) {
    const youEmail = await youFindEmail(businessName, location);
    if (youEmail) return youEmail;
  }

  // ── 3. Tavily fallback — second-opinion search ───────────────────────
  if (businessName && location) {
    const tavilyEmail = await tavilyFindEmail(businessName, location);
    if (tavilyEmail) return tavilyEmail;
  }

  // ── 4. No scraped email — derive info@ for real business domains ─────
  if (HOSTED_DOMAINS.test(domain)) return null;
  return `info@${domain}`;
}

/**
 * Last-resort email finder: Google web search for "{business} {city} email".
 * Searches snippets from organic results for any real email address.
 * Uses 1 SerpAPI credit per call — only invoked when all other methods fail.
 */
export async function findEmailViaWebSearch(
  businessName: string,
  location: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const q = `"${businessName}" ${location} email`;
    const res = await fetch(
      `${SERP_BASE}?${new URLSearchParams({ engine: "google", q, api_key: apiKey, num: "5", hl: "en", gl: "us" })}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (data.error) return null;

    const emailRe = /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;
    for (const r of (data.organic_results || [])) {
      const text = `${r.snippet || ""} ${r.title || ""}`;
      let m: RegExpExecArray | null;
      while ((m = emailRe.exec(text)) !== null) {
        const email = m[1].toLowerCase();
        const domain = email.split("@")[1] || "";
        if (!SKIP_EMAIL.test(email) && !HOSTED_DOMAINS.test(domain)) return email;
      }
    }
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
