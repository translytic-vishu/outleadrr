/**
 * You.com Search API — primary research engine for Outleadrr
 * Env var: YOU_API_KEY  (from you.com/api)
 *
 * Docs: https://documentation.you.com/api-reference
 *
 * Used for:
 *  1. Finding real business emails (primary — before Tavily fallback)
 *  2. Local market research for AI email context
 *  3. Per-business enrichment (reputation, reviews, news snippets)
 */

const YOU_BASE = "https://api.you.com";

const EMAIL_RE   = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g;
const SKIP_EMAIL = /noreply|no-reply|mailer|daemon|bounce|sentry|example\.|w3\.org|schema\.org|googleapis|cloudflare|privacy@|legal@|dmca@|abuse@|unsubscribe@/i;
const HOSTED     = /wixsite|squarespace|weebly|godaddysites|business\.site|yelp\.com|yellowpages|facebook|instagram|twitter/i;
const PREFERRED  = /^(info|contact|hello|office|admin|mail|team|sales|support|booking|reception)@/i;

function getKey(): string | null {
  return process.env.YOU_API_KEY || null;
}

/** Raw You.com web search — returns hit array */
async function youSearch(query: string, maxResults = 5): Promise<any[]> {
  const key = getKey();
  if (!key) return [];

  try {
    const url = `${YOU_BASE}/api/search?` + new URLSearchParams({
      query,
      count: String(maxResults),
      safesearch: "off",
      country: "us",
    });

    const res = await fetch(url, {
      headers: { "X-API-Key": key },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`[You.com] Search failed (${res.status}): ${query}`);
      return [];
    }

    const data = await res.json() as any;
    // You.com returns { hits: [...] } or { results: [...] }
    return data.hits || data.results || data.web?.results || [];
  } catch (err: any) {
    console.warn("[You.com] Request error:", err.message);
    return [];
  }
}

/** You.com AI snippets — returns a synthesised answer string */
async function youSnippets(query: string): Promise<string> {
  const key = getKey();
  if (!key) return "";

  try {
    const url = `${YOU_BASE}/api/snippets?` + new URLSearchParams({ query });
    const res = await fetch(url, {
      headers: { "X-API-Key": key },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const data = await res.json() as any;
    // You.com snippets returns { snippets: [{ snippet }] } or { answer: "..." }
    if (data.answer) return (data.answer as string).slice(0, 600);
    const snippets: string[] = (data.snippets || []).map((s: any) => s.snippet || "").filter(Boolean);
    return snippets.join(" ").slice(0, 600);
  } catch {
    return "";
  }
}

/**
 * Find a real email address for a specific business using You.com.
 * Returns null if You.com key not set or no email found.
 */
export async function youFindEmail(
  businessName: string,
  location: string,
): Promise<string | null> {
  const hits = await youSearch(`"${businessName}" ${location} contact email`, 6);
  if (hits.length === 0) return null;

  const candidates: string[] = [];
  for (const hit of hits) {
    const text = `${hit.title || ""} ${hit.description || ""} ${hit.snippet || ""} ${hit.url || ""}`;
    let m: RegExpExecArray | null;
    const re = new RegExp(EMAIL_RE.source, "g");
    while ((m = re.exec(text)) !== null) {
      const email = m[1].toLowerCase();
      const domain = email.split("@")[1] || "";
      if (!SKIP_EMAIL.test(email) && !HOSTED.test(domain)) candidates.push(email);
    }
  }

  if (candidates.length === 0) return null;
  return candidates.find(e => PREFERRED.test(e)) || candidates[0];
}

/**
 * Research a local market to give the AI real context.
 * Returns a compact paragraph (max 600 chars) about the industry in that location.
 */
export async function youResearchMarket(
  businessType: string,
  location: string,
): Promise<string> {
  // Try AI snippets first (synthesised answer is more useful)
  const answer = await youSnippets(
    `${businessType} businesses market challenges opportunities trends ${location}`,
  );
  if (answer && answer.length > 40) return answer;

  // Fallback to regular search hits
  const hits = await youSearch(
    `${businessType} businesses in ${location} market overview`, 3,
  );
  return hits
    .map(h => (h.description || h.snippet || "").slice(0, 200))
    .filter(Boolean)
    .join(" ")
    .slice(0, 600);
}

/**
 * Enrich a batch of businesses with real context snippets.
 * Used to give the AI genuine details per business (news, reputation, specifics).
 */
export async function youEnrichBusinesses(
  businesses: { name: string; location: string }[],
): Promise<Record<string, string>> {
  if (!getKey() || businesses.length === 0) return {};

  const results: Record<string, string> = {};
  const BATCH = 5;

  for (let i = 0; i < businesses.length; i += BATCH) {
    const batch = businesses.slice(i, i + BATCH);
    await Promise.all(batch.map(async ({ name, location }) => {
      const hits = await youSearch(`"${name}" ${location} reviews reputation`, 2);
      const snippet = hits
        .map(h => (h.description || h.snippet || "").slice(0, 150))
        .filter(Boolean)
        .join(" ")
        .slice(0, 300);
      if (snippet) results[name] = snippet;
    }));
  }

  return results;
}
